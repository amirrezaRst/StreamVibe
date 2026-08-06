const Cinema = require('../model/cinemaModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');
const BookedSeat = require('../model/bookedSeatModel');


//! Get Request
exports.getHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id).populate('cinema', 'name city country address');
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        res.status(200).json({ status: 200, message: "Hall fetched successfully", hall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Post Request
exports.createHall = async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.body.cinema);
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        const duplicateSeat = findDuplicateSeat(req.body.seatMap);
        if (duplicateSeat) {
            return res.status(400).json({ status: 400, message: `Duplicate seat "${duplicateSeat}" in the seat map` });
        }

        const hall = await Hall.create(req.body);
        res.status(201).json({ status: 201, message: "Hall created successfully", hall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Put Request
exports.updateHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id);
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        if (req.body.seatMap) {
            const duplicateSeat = findDuplicateSeat(req.body.seatMap);
            if (duplicateSeat) {
                return res.status(400).json({ status: 400, message: `Duplicate seat "${duplicateSeat}" in the seat map` });
            }

            /**
             * This used to refuse any edit at all while the hall had a single
             * upcoming showtime, which in practice meant the seat map could
             * never be touched — every working hall has screenings ahead of it.
             *
             * What actually has to be protected is narrower: a seat somebody is
             * already sitting in. Renaming a tier or adding a row hurts nobody;
             * deleting the seat under a paid ticket does. So only that is
             * refused, and it is named.
             */
            const missing = await findSoldSeatsRemovedBy(hall._id, req.body.seatMap);
            if (missing.length) {
                return res.status(409).json({
                    status: 409,
                    message: missing.length === 1
                        ? `Seat ${missing[0]} is booked for an upcoming screening and can't be removed.`
                        : `${missing.length} booked seats would be removed: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}. They belong to upcoming screenings.`,
                    seats: missing,
                });
            }
        }

        const updatedHall = await Hall.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 200, message: "Hall updated successfully", hall: updatedHall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Delete Request
exports.deleteHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id);
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        const upcoming = await Showtime.countDocuments({
            hall: hall._id,
            startsAt: { $gte: new Date() },
            status: 'scheduled'
        });
        if (upcoming > 0) {
            return res.status(409).json({
                status: 409,
                message: `This hall has ${upcoming} upcoming showtime(s). Cancel them before deleting it.`
            });
        }

        await hall.deleteOne();

        res.status(200).json({ status: 200, message: "Hall deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


/**
 * Which seats that are spoken for would stop existing under a proposed layout.
 *
 * Claims rather than bookings: a seat somebody is holding right now, mid-payment,
 * is just as unavailable as one already paid for — and the hold is exactly when
 * losing the seat under them would be worst.
 */
async function findSoldSeatsRemovedBy(hallId, seatMap) {
    const upcoming = await Showtime.find({
        hall: hallId,
        startsAt: { $gte: new Date() },
        status: 'scheduled',
    }).select('_id');

    if (!upcoming.length) return [];

    const claimed = await BookedSeat.distinct('seatLabel', {
        showtime: { $in: upcoming.map(showtime => showtime._id) },
    });
    if (!claimed.length) return [];

    //! only bookable seats count as still existing: turning one into a gap
    //! removes it just as surely as deleting the row
    const surviving = new Set();
    for (const { row, seats = [] } of seatMap) {
        for (const seat of seats) {
            if (!seat.disabled) surviving.add(`${String(row).toUpperCase()}${seat.number}`);
        }
    }

    return claimed.filter(label => !surviving.has(label)).sort();
}

//! seat labels are the booking key (row + number), so a duplicate would make two
//! physical seats indistinguishable once tickets are issued
function findDuplicateSeat(seatMap = []) {
    const seen = new Set();

    for (const { row, seats = [] } of seatMap) {
        for (const seat of seats) {
            const label = `${String(row).toUpperCase()}${seat.number}`;
            if (seen.has(label)) return label;
            seen.add(label);
        }
    }
    return null;
}
