const Movie = require('../model/movieModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');
const BookedSeat = require('../model/bookedSeatModel');
const Booking = require('../model/bookingModel');
const { escapeRegex } = require('../utils/escapeRegex');

//! gap between the end of one screening and the start of the next in the same
//! hall, for the audience to clear out and the room to be cleaned
const TURNAROUND_MINUTES = 15;


//! Get Request
exports.getShowtimesByMovie = async (req, res) => {
    const { city, date } = req.query;

    try {
        const movie = await Movie.findById(req.params.movieId).select('title duration release_status thumbnail');
        if (!movie) return res.status(404).json({ status: 404, message: "Movie not found" });

        const filter = {
            movie: movie._id,
            status: 'scheduled',
            startsAt: { $gte: new Date() },
        };

        if (date) {
            const dayStart = new Date(date);
            if (isNaN(dayStart)) {
                return res.status(400).json({ status: 400, message: "Invalid date" });
            }
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            //! never advertise a screening that has already started today
            filter.startsAt = { $gte: new Date(Math.max(dayStart, new Date())), $lt: dayEnd };
        }

        const showtimes = await Showtime.find(filter)
            .populate('cinema', 'name city country address')
            .populate('hall', 'name screenType')
            .sort({ startsAt: 1 });

        //! city lives on the cinema, so filter after populating rather than with a join
        const visible = city
            ? showtimes.filter(s => s.cinema && new RegExp(`^${escapeRegex(city.trim())}$`, 'i').test(s.cinema.city))
            : showtimes;

        //! the UI picks a cinema first, then a time — so group it that way here
        const byCinema = groupByCinema(visible);

        res.status(200).json({
            status: 200,
            message: "Showtimes fetched successfully",
            movie,
            total: visible.length,
            cinemas: byCinema,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getNowPlaying = async (req, res) => {
    const { city } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 8, 24);

    try {
        const pipeline = [
            { $match: { status: 'scheduled', startsAt: { $gte: new Date() } } },
            { $sort: { startsAt: 1 } },
            {
                $lookup: {
                    from: 'cinemas', localField: 'cinema', foreignField: '_id', as: 'cinemaDoc'
                }
            },
            { $unwind: '$cinemaDoc' },
        ];

        if (city) {
            pipeline.push({
                $match: { 'cinemaDoc.city': new RegExp(`^${escapeRegex(city.trim())}$`, 'i') }
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: '$movie',
                    //! only the soonest few matter on a home page row
                    showtimes: { $push: { _id: '$_id', startsAt: '$startsAt', cinema: '$cinemaDoc.name' } },
                    cinemaIds: { $addToSet: '$cinema' },
                    nextStart: { $first: '$startsAt' },
                }
            },
            {
                $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' }
            },
            { $unwind: '$movie' },
            { $sort: { nextStart: 1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    movie: { _id: '$movie._id', title: '$movie.title', thumbnail: '$movie.thumbnail', duration: '$movie.duration' },
                    cinemaCount: { $size: '$cinemaIds' },
                    showtimes: { $slice: ['$showtimes', 6] },
                }
            }
        );

        const nowPlaying = await Showtime.aggregate(pipeline);

        res.status(200).json({
            status: 200,
            message: "Now playing fetched successfully",
            total: nowPlaying.length,
            nowPlaying,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getShowtime = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie', 'title duration thumbnail cover age_rating genres')
            .populate('cinema', 'name city country address')
            .populate('hall', 'name screenType seatMap');

        if (!showtime) return res.status(404).json({ status: 404, message: "Showtime not found" });

        //! lapsed holds are excluded explicitly rather than trusting the TTL
        //! monitor, which only sweeps about once a minute
        const claimed = await BookedSeat.find({
            showtime: showtime._id,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }).select('seatLabel');

        res.status(200).json({
            status: 200,
            message: "Showtime fetched successfully",
            showtime,
            bookedSeats: claimed.map(seat => seat.seatLabel),
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Post Request
exports.createShowtime = async (req, res) => {
    try {
        const [movie, hall] = await Promise.all([
            Movie.findById(req.body.movie).select('duration'),
            Hall.findById(req.body.hall),
        ]);

        if (!movie) return res.status(404).json({ status: 404, message: "Movie not found" });
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        const missingTier = findUnpricedTier(hall, req.body.pricing);
        if (missingTier) {
            return res.status(400).json({
                status: 400,
                message: `This hall has "${missingTier}" seats but no price was set for that tier.`
            });
        }

        const startsAt = new Date(req.body.startsAt);
        const endsAt = new Date(startsAt.getTime() + movie.duration * 60000);

        const clash = await findHallClash(hall._id, startsAt, endsAt);
        if (clash) {
            return res.status(409).json({
                status: 409,
                message: `This hall is already booked from ${clash.startsAt.toISOString()} to ${clash.endsAt.toISOString()}.`
            });
        }

        const showtime = await Showtime.create({
            ...req.body,
            cinema: hall.cinema,
            endsAt,
        });

        res.status(201).json({ status: 201, message: "Showtime created successfully", showtime });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Put Request
exports.updateShowtime = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id);
        if (!showtime) return res.status(404).json({ status: 404, message: "Showtime not found" });

        const payload = { ...req.body };

        //! moving a screening means recomputing its end and re-checking the hall is free
        if (payload.startsAt) {
            const movie = await Movie.findById(showtime.movie).select('duration');
            if (!movie) return res.status(404).json({ status: 404, message: "Movie not found" });

            const startsAt = new Date(payload.startsAt);
            payload.endsAt = new Date(startsAt.getTime() + movie.duration * 60000);

            const clash = await findHallClash(showtime.hall, startsAt, payload.endsAt, showtime._id);
            if (clash) {
                return res.status(409).json({
                    status: 409,
                    message: `This hall is already booked from ${clash.startsAt.toISOString()} to ${clash.endsAt.toISOString()}.`
                });
            }
        }

        //! the hall is fixed once created; changing it would move people's seats
        delete payload.hall;
        delete payload.cinema;

        const updated = await Showtime.findByIdAndUpdate(showtime._id, payload, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 200, message: "Showtime updated successfully", showtime: updated });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Delete Request
exports.deleteShowtime = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id);
        if (!showtime) return res.status(404).json({ status: 404, message: "Showtime not found" });

        //! people hold tickets against this screening — deleting it would strand
        //! them. Cancelling the showtime is the honest way to call one off.
        const sold = await Booking.countDocuments({ showtime: showtime._id, status: 'confirmed' });
        if (sold > 0) {
            return res.status(409).json({
                status: 409,
                message: `This showtime has ${sold} confirmed booking(s). Cancel it instead of deleting it.`
            });
        }

        //! only unpaid holds remain, so releasing them costs nobody a ticket
        await BookedSeat.deleteMany({ showtime: showtime._id });
        await Booking.deleteMany({ showtime: showtime._id, status: { $in: ['pending', 'expired'] } });
        await showtime.deleteOne();

        res.status(200).json({ status: 200, message: "Showtime deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! every seat tier physically present in the hall needs a price on the showtime,
//! otherwise those seats can't be sold
function findUnpricedTier(hall, pricing = {}) {
    const tiersInHall = new Set();

    for (const row of hall.seatMap) {
        for (const seat of row.seats) {
            if (!seat.disabled) tiersInHall.add(seat.tier);
        }
    }

    for (const tier of tiersInHall) {
        if (pricing[tier] === undefined || pricing[tier] === null) return tier;
    }
    return null;
}

//! one hall can only run one screening at a time
async function findHallClash(hallId, startsAt, endsAt, ignoreShowtimeId = null) {
    const filter = {
        hall: hallId,
        status: 'scheduled',
        //! overlap, allowing for turnaround on both sides
        startsAt: { $lt: new Date(endsAt.getTime() + TURNAROUND_MINUTES * 60000) },
        endsAt: { $gt: new Date(startsAt.getTime() - TURNAROUND_MINUTES * 60000) },
    };
    if (ignoreShowtimeId) filter._id = { $ne: ignoreShowtimeId };

    return Showtime.findOne(filter).select('startsAt endsAt');
}

function groupByCinema(showtimes) {
    const map = new Map();

    for (const showtime of showtimes) {
        if (!showtime.cinema) continue;

        const key = String(showtime.cinema._id);
        if (!map.has(key)) {
            map.set(key, { cinema: showtime.cinema, showtimes: [] });
        }

        map.get(key).showtimes.push({
            _id: showtime._id,
            startsAt: showtime.startsAt,
            endsAt: showtime.endsAt,
            hall: showtime.hall,
            pricing: showtime.pricing,
            language: showtime.language,
            currency: showtime.currency,
        });
    }

    return [...map.values()];
}
