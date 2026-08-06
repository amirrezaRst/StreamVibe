const mongoose = require('mongoose');

const Cinema = require('../model/cinemaModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');
const Booking = require('../model/bookingModel');
const BookedSeat = require('../model/bookedSeatModel');
const Movie = require('../model/movieModel');
const BOOKING_POPULATE = require('../utils/bookingPopulate');

const startOfDay = (value) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (value) => {
    const date = startOfDay(value);
    date.setHours(23, 59, 59, 999);
    return date;
};

//! bookable seats only — a disabled seat is a gap in the layout, not inventory
const countSeats = (seatMap = []) => seatMap.reduce(
    (total, row) => total + row.seats.filter(seat => !seat.disabled).length, 0
);

const countByTier = (seatMap = []) => seatMap.reduce((tally, row) => {
    row.seats.forEach(seat => {
        if (seat.disabled) return;
        tally[seat.tier] = (tally[seat.tier] || 0) + 1;
    });
    return tally;
}, {});


/**
 * The venue list. The public one carries nothing an operator needs — how many
 * halls, how many seats, and whether anything is actually screening today are
 * the three facts that tell venues apart.
 */
exports.getCinemas = async (req, res) => {
    try {
        const filter = {};
        if (req.query.city) filter.city = req.query.city;
        if (req.query.active === 'true') filter.isActive = true;
        if (req.query.active === 'false') filter.isActive = false;

        const cinemas = await Cinema.find(filter).sort({ name: 1 }).lean();
        if (!cinemas.length) {
            return res.status(200).json({ status: 200, message: "No cinemas", cinemas: [], totals: { halls: 0, seats: 0 } });
        }

        const ids = cinemas.map(cinema => cinema._id);

        const [halls, todays] = await Promise.all([
            Hall.find({ cinema: { $in: ids } }).select('cinema seatMap').lean(),
            Showtime.aggregate([
                {
                    $match: {
                        cinema: { $in: ids },
                        status: { $ne: 'cancelled' },
                        startsAt: { $gte: startOfDay(), $lte: endOfDay() },
                    },
                },
                { $group: { _id: '$cinema', total: { $sum: 1 } } },
            ]),
        ]);

        const byCinema = new Map(ids.map(id => [String(id), { halls: 0, seats: 0 }]));
        halls.forEach(hall => {
            const entry = byCinema.get(String(hall.cinema));
            if (!entry) return;
            entry.halls += 1;
            entry.seats += countSeats(hall.seatMap);
        });

        const screeningsToday = new Map(todays.map(row => [String(row._id), row.total]));

        const withCounts = cinemas.map(cinema => ({
            ...cinema,
            halls: byCinema.get(String(cinema._id)).halls,
            seats: byCinema.get(String(cinema._id)).seats,
            screeningsToday: screeningsToday.get(String(cinema._id)) || 0,
        }));

        res.status(200).json({
            status: 200,
            message: "Cinemas fetched successfully",
            cinemas: withCounts,
            totals: {
                halls: withCounts.reduce((sum, c) => sum + c.halls, 0),
                seats: withCounts.reduce((sum, c) => sum + c.seats, 0),
                cities: new Set(withCounts.map(c => c.city)).size,
            },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! One venue with its halls, each carrying its own seat map so the list can
//! draw a thumbnail of the real layout — two rooms called "Screen 2" are told
//! apart by shape faster than by any label.
exports.getCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id).lean();
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        const halls = await Hall.find({ cinema: cinema._id }).sort({ name: 1 }).lean();

        const withCounts = halls.map(hall => ({
            ...hall,
            totalSeats: countSeats(hall.seatMap),
            tiers: countByTier(hall.seatMap),
            rows: hall.seatMap.length,
        }));

        res.status(200).json({
            status: 200,
            message: "Cinema fetched successfully",
            cinema: {
                ...cinema,
                halls: withCounts.length,
                seats: withCounts.reduce((sum, hall) => sum + hall.totalSeats, 0),
            },
            halls: withCounts,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * A hall for editing. The seat map alone is not enough: a seat somebody has
 * already paid for cannot be turned into a gap, so the editor needs to know
 * which ones those are before it lets anyone try.
 */
exports.getHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id).populate('cinema', 'name city').lean();
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        const upcoming = await Showtime.find({
            hall: hall._id,
            status: { $ne: 'cancelled' },
            startsAt: { $gte: new Date() },
        }).select('_id').lean();

        //! claims rather than bookings: a seat somebody is holding right now is
        //! just as unavailable as one already paid for
        const claims = await BookedSeat.find({
            showtime: { $in: upcoming.map(showtime => showtime._id) },
        }).select('seatLabel').lean();

        res.status(200).json({
            status: 200,
            message: "Hall fetched successfully",
            hall: {
                ...hall,
                totalSeats: countSeats(hall.seatMap),
                tiers: countByTier(hall.seatMap),
            },
            //! deduplicated: the same seat can be sold for several screenings
            soldSeats: [...new Set(claims.map(claim => claim.seatLabel))],
            upcomingShowtimes: upcoming.length,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * One day of one cinema, every hall, with occupancy folded in. The schedule
 * grid needs all of it at once — a request per hall would make the view flicker
 * into place a row at a time.
 */
exports.getSchedule = async (req, res) => {
    try {
        const cinemaId = req.query.cinema;
        if (!cinemaId || !mongoose.isValidObjectId(cinemaId)) {
            return res.status(400).json({ status: 400, message: "A cinema is required" });
        }

        const from = startOfDay(req.query.date);
        const to = endOfDay(req.query.date);

        const [cinema, halls, showtimes] = await Promise.all([
            Cinema.findById(cinemaId).select('name city').lean(),
            Hall.find({ cinema: cinemaId }).sort({ name: 1 }).lean(),
            Showtime.find({ cinema: cinemaId, startsAt: { $gte: from, $lte: to } })
                .populate('movie', 'title duration thumbnail')
                .sort({ startsAt: 1 })
                .lean(),
        ]);

        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        const claims = await BookedSeat.aggregate([
            { $match: { showtime: { $in: showtimes.map(showtime => showtime._id) } } },
            { $group: { _id: '$showtime', taken: { $sum: 1 } } },
        ]);
        const takenBy = new Map(claims.map(row => [String(row._id), row.taken]));

        const capacityBy = new Map(halls.map(hall => [String(hall._id), countSeats(hall.seatMap)]));

        const withFill = showtimes.map(showtime => {
            const capacity = capacityBy.get(String(showtime.hall)) || 0;
            const taken = takenBy.get(String(showtime._id)) || 0;

            return {
                ...showtime,
                capacity,
                taken,
                occupancy: capacity ? Math.round((taken / capacity) * 100) : 0,
            };
        });

        res.status(200).json({
            status: 200,
            message: "Schedule fetched successfully",
            cinema,
            date: from,
            halls: halls.map(hall => ({
                _id: hall._id,
                name: hall.name,
                screenType: hall.screenType,
                totalSeats: countSeats(hall.seatMap),
                tiers: countByTier(hall.seatMap),
            })),
            showtimes: withFill,
            summary: {
                screenings: withFill.length,
                //! averaged across screenings, not across seats: a packed 40-seat
                //! room and an empty 200-seat one are two data points, not 240
                averageOccupancy: withFill.length
                    ? Math.round(withFill.reduce((sum, s) => sum + s.occupancy, 0) / withFill.length)
                    : 0,
            },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! A booking with the room drawn around it. "F7, F8" is a label; where those
//! seats are is what somebody on the phone is actually asking about.
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate(BOOKING_POPULATE)
            .populate('user', 'fullName email');

        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        const hall = booking.showtime && booking.showtime.hall
            ? await Hall.findById(booking.showtime.hall._id).select('seatMap name screenType').lean()
            : null;

        res.status(200).json({
            status: 200,
            message: "Booking fetched successfully",
            booking,
            seatMap: hall ? hall.seatMap : null,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! Every film that could be scheduled, with the runtime the form needs to work
//! out an end time. Small enough to send whole; the picker is a dropdown.
exports.getSchedulableMovies = async (req, res) => {
    try {
        const movies = await Movie.find()
            .select('title duration thumbnail')
            .sort({ title: 1 })
            .lean();

        res.status(200).json({ status: 200, message: "Movies fetched successfully", movies });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
