const Booking = require('../model/bookingModel');
const BookedSeat = require('../model/bookedSeatModel');
const Showtime = require('../model/showtimeModel');
const { HOLD_MINUTES, MAX_SEATS_PER_BOOKING } = require('../constants/booking');


//! Post Request
exports.holdSeats = async (req, res) => {
    const userId = req.user.id;
    const { showtime: showtimeId, seats } = req.body;

    try {
        const showtime = await Showtime.findById(showtimeId).populate('hall', 'seatMap');
        if (!showtime) return res.status(404).json({ status: 404, message: "Showtime not found" });

        if (showtime.status === 'cancelled') {
            return res.status(409).json({ status: 409, message: "This screening has been cancelled" });
        }
        if (showtime.startsAt <= new Date()) {
            return res.status(409).json({ status: 409, message: "This screening has already started" });
        }

        //! the same seat sent twice shouldn't count twice against the limit
        const labels = [...new Set(seats.map(label => String(label).trim().toUpperCase()))];
        if (labels.length > MAX_SEATS_PER_BOOKING) {
            return res.status(400).json({
                status: 400,
                message: `You can book at most ${MAX_SEATS_PER_BOOKING} seats at a time`
            });
        }

        const resolved = resolveSeats(labels, showtime);
        if (resolved.error) {
            return res.status(400).json({ status: 400, message: resolved.error });
        }

        //! TTL only sweeps about once a minute, so a lapsed hold can still be
        //! sitting there; clear it now rather than telling the user it's taken
        await BookedSeat.deleteMany({ showtime: showtime._id, expiresAt: { $lte: new Date() } });

        const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60000);
        const booking = await Booking.create({
            user: userId,
            showtime: showtime._id,
            seats: resolved.seats,
            totalPrice: resolved.seats.reduce((sum, seat) => sum + seat.price, 0),
            currency: showtime.currency,
            status: 'pending',
            expiresAt,
        });

        //! the unique index on (showtime, seatLabel) decides who wins here; there
        //! are no transactions on a standalone mongo, so on any failure we undo
        //! our own writes rather than rolling back
        try {
            await BookedSeat.insertMany(
                resolved.seats.map(seat => ({
                    showtime: showtime._id,
                    seatLabel: seat.label,
                    booking: booking._id,
                    user: userId,
                    expiresAt,
                })),
                { ordered: false }
            );
        } catch (err) {
            const taken = await BookedSeat
                .find({ showtime: showtime._id, seatLabel: { $in: labels }, booking: { $ne: booking._id } })
                .select('seatLabel');

            await BookedSeat.deleteMany({ booking: booking._id });
            await booking.deleteOne();

            if (isDuplicateKeyError(err)) {
                return res.status(409).json({
                    status: 409,
                    message: "Some of those seats have just been taken",
                    takenSeats: taken.map(seat => seat.seatLabel),
                });
            }
            throw err;
        }

        res.status(201).json({
            status: 201,
            message: `Seats held for ${HOLD_MINUTES} minutes`,
            booking,
            expiresAt,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        if (String(booking.user) !== req.user.id) {
            return res.status(403).json({ status: 403, message: "You can only confirm your own booking" });
        }
        if (booking.status === 'confirmed') {
            return res.status(200).json({ status: 200, message: "Booking already confirmed", booking });
        }
        if (booking.status !== 'pending') {
            return res.status(409).json({ status: 409, message: `This booking is ${booking.status}` });
        }
        if (booking.isExpired) {
            return res.status(409).json({ status: 409, message: "Your hold expired — the seats were released" });
        }

        //! guard against the hold having been swept between the check above and
        //! here: if any seat is gone, the booking can no longer be honoured
        const stillHeld = await BookedSeat.countDocuments({ booking: booking._id });
        if (stillHeld !== booking.seats.length) {
            await BookedSeat.deleteMany({ booking: booking._id });
            booking.status = 'expired';
            await booking.save();

            return res.status(409).json({ status: 409, message: "Your hold expired — the seats were released" });
        }

        //! clearing expiresAt takes the seats out of the TTL monitor's reach
        await BookedSeat.updateMany({ booking: booking._id }, { $set: { expiresAt: null } });

        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        booking.expiresAt = null;
        await booking.save();

        res.status(200).json({ status: 200, message: "Booking confirmed", booking });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        const isOwner = String(booking.user) === req.user.id;
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ status: 403, message: "You can only cancel your own booking" });
        }
        if (booking.status === 'cancelled') {
            return res.status(200).json({ status: 200, message: "Booking already cancelled", booking });
        }
        if (booking.status === 'expired') {
            return res.status(409).json({ status: 409, message: "This booking already expired" });
        }

        await BookedSeat.deleteMany({ booking: booking._id });

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.expiresAt = null;
        await booking.save();

        res.status(200).json({ status: 200, message: "Booking cancelled and seats released", booking });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Get Request
exports.getMyBookings = async (req, res) => {
    try {
        //! settle any holds that lapsed while the user was away, so the list
        //! doesn't show something as pending that can no longer be paid for
        await Booking.updateMany(
            { user: req.user.id, status: 'pending', expiresAt: { $lte: new Date() } },
            { $set: { status: 'expired', expiresAt: null } }
        );

        const bookings = await Booking.find({ user: req.user.id })
            .populate({
                path: 'showtime',
                select: 'startsAt endsAt language movie cinema hall',
                populate: [
                    { path: 'movie', select: 'title thumbnail duration' },
                    { path: 'cinema', select: 'name city country address' },
                    { path: 'hall', select: 'name screenType' },
                ],
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 200, message: "Bookings fetched successfully", total: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'showtime',
                select: 'startsAt endsAt language movie cinema hall',
                populate: [
                    { path: 'movie', select: 'title thumbnail duration' },
                    { path: 'cinema', select: 'name city country address' },
                    { path: 'hall', select: 'name screenType' },
                ],
            });

        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        const isOwner = String(booking.user) === req.user.id;
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ status: 403, message: "You can only view your own booking" });
        }

        res.status(200).json({ status: 200, message: "Booking fetched successfully", booking });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! turns requested seat labels into priced seats, rejecting anything that isn't
//! a real, bookable, priced seat in this showtime's hall
function resolveSeats(labels, showtime) {
    const seatIndex = new Map();

    for (const row of showtime.hall.seatMap) {
        for (const seat of row.seats) {
            seatIndex.set(`${row.row}${seat.number}`, seat);
        }
    }

    const seats = [];
    for (const label of labels) {
        const seat = seatIndex.get(label);

        if (!seat) return { error: `Seat "${label}" does not exist in this hall` };
        if (seat.disabled) return { error: `Seat "${label}" is not available for booking` };

        const price = showtime.pricing?.[seat.tier];
        if (price === undefined || price === null) {
            return { error: `Seat "${label}" has no price set for this screening` };
        }

        seats.push({ label, tier: seat.tier, price });
    }

    return { seats };
}

//! insertMany with ordered:false reports duplicates through writeErrors rather
//! than a top-level code
function isDuplicateKeyError(err) {
    if (err?.code === 11000) return true;
    return Array.isArray(err?.writeErrors) && err.writeErrors.some(e => e?.err?.code === 11000 || e?.code === 11000);
}
