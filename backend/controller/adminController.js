const mongoose = require('mongoose');

const Booking = require('../model/bookingModel');
const BookedSeat = require('../model/bookedSeatModel');
const Showtime = require('../model/showtimeModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const User = require('../model/userModel');
const Support = require('../model/supportModel');
const Review = require('../model/reviewModel');
const BOOKING_POPULATE = require('../utils/bookingPopulate');
const { stripe, isConfigured } = require('../utils/stripe');

const DAY = 24 * 60 * 60 * 1000;

//! money only counts once it has actually been taken
const SETTLED = { status: 'confirmed', 'payment.status': 'paid' };

const daysAgo = (n) => new Date(Date.now() - n * DAY);

//! percentage change, with the awkward case spelled out: coming up from zero
//! is not "infinity percent", it just has no meaningful comparison
const changeSince = (current, previous) => {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
};


/**
 * Everything the console's first screen needs, in one request. Split into
 * independent pieces so a slow one cannot hold up the rest, then gathered.
 */
exports.getOverview = async (req, res) => {
    try {
        const window = Math.min(parseInt(req.query.days) || 30, 365);
        const from = daysAgo(window);
        const previousFrom = daysAgo(window * 2);

        const [revenue, previousRevenue, tickets, previousTickets, members, previousMembers,
            series, topTitles, tonight, occupancy] = await Promise.all([
                sumRevenue(from, new Date()),
                sumRevenue(previousFrom, from),
                countTickets(from, new Date()),
                countTickets(previousFrom, from),
                User.countDocuments({ _id: { $gte: objectIdFrom(from) } }),
                User.countDocuments({ _id: { $gte: objectIdFrom(previousFrom), $lt: objectIdFrom(from) } }),
                revenueSeries(from, window),
                topTitlesByTickets(from),
                tonightsScreenings(),
                averageOccupancy(from),
            ]);

        res.status(200).json({
            status: 200,
            message: "Overview fetched successfully",
            overview: {
                window,
                kpis: {
                    revenue: { value: revenue, change: changeSince(revenue, previousRevenue) },
                    tickets: { value: tickets, change: changeSince(tickets, previousTickets) },
                    occupancy: { value: occupancy.current, change: changeSince(occupancy.current, occupancy.previous) },
                    members: { value: members, change: changeSince(members, previousMembers) },
                },
                series,
                topTitles,
                tonight,
            },
        });
    } catch (error) {
        console.error('[admin] overview failed:', error.message);
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! Users have no createdAt column, but an ObjectId's leading bytes are the
//! second it was minted — so a date can be turned into a comparable id
const objectIdFrom = (date) => mongoose.Types.ObjectId.createFromTime(Math.floor(date.getTime() / 1000));

const sumRevenue = async (from, to) => {
    const [row] = await Booking.aggregate([
        { $match: { ...SETTLED, 'payment.paidAt': { $gte: from, $lt: to } } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]);
    return row ? Math.round(row.total * 100) / 100 : 0;
};

const countTickets = async (from, to) => {
    const [row] = await Booking.aggregate([
        { $match: { ...SETTLED, 'payment.paidAt': { $gte: from, $lt: to } } },
        { $group: { _id: null, seats: { $sum: { $size: '$seats' } } } },
    ]);
    return row ? row.seats : 0;
};

//! one point per day, including the days nothing sold — a gap in a time series
//! reads as missing data rather than as a quiet Tuesday
const revenueSeries = async (from, days) => {
    const rows = await Booking.aggregate([
        { $match: { ...SETTLED, 'payment.paidAt': { $gte: from } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } },
                revenue: { $sum: '$payment.amount' },
                tickets: { $sum: { $size: '$seats' } },
            },
        },
    ]);

    const byDay = new Map(rows.map(row => [row._id, row]));
    const points = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
        const row = byDay.get(date);
        points.push({
            date,
            revenue: row ? Math.round(row.revenue * 100) / 100 : 0,
            tickets: row ? row.tickets : 0,
        });
    }

    return points;
};

const topTitlesByTickets = async (from) => {
    return Booking.aggregate([
        { $match: { ...SETTLED, 'payment.paidAt': { $gte: from } } },
        { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
        { $unwind: '$showtime' },
        {
            $group: {
                _id: '$showtime.movie',
                tickets: { $sum: { $size: '$seats' } },
                revenue: { $sum: '$payment.amount' },
            },
        },
        { $sort: { tickets: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
        { $unwind: '$movie' },
        {
            $project: {
                _id: 1,
                title: '$movie.title',
                thumbnail: '$movie.thumbnail',
                tickets: 1,
                revenue: { $round: ['$revenue', 2] },
            },
        },
    ]);
};

/**
 * What is on screen between now and the end of the day, with live occupancy.
 * Seats are counted from the claims collection rather than from bookings, so a
 * seat someone is holding right now counts as taken — which is what an
 * operator looking at the room would see.
 */
const tonightsScreenings = async () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const showtimes = await Showtime.find({
        status: { $ne: 'cancelled' },
        startsAt: { $gte: now, $lte: endOfDay },
    })
        .populate('movie', 'title thumbnail')
        .populate('cinema', 'name city')
        .populate('hall', 'name screenType seatMap')
        .sort({ startsAt: 1 })
        .limit(8);

    if (!showtimes.length) return [];

    const claims = await BookedSeat.aggregate([
        { $match: { showtime: { $in: showtimes.map(s => s._id) } } },
        { $group: { _id: '$showtime', taken: { $sum: 1 } } },
    ]);
    const takenBy = new Map(claims.map(row => [String(row._id), row.taken]));

    return showtimes.map(showtime => {
        const capacity = showtime.hall && showtime.hall.totalSeats ? showtime.hall.totalSeats : 0;
        const taken = takenBy.get(String(showtime._id)) || 0;

        return {
            _id: showtime._id,
            startsAt: showtime.startsAt,
            movie: showtime.movie,
            cinema: showtime.cinema,
            hall: showtime.hall && { _id: showtime.hall._id, name: showtime.hall.name, screenType: showtime.hall.screenType },
            capacity,
            taken,
            occupancy: capacity ? Math.round((taken / capacity) * 100) : 0,
        };
    });
};

//! averaged across screenings that have already happened, so an empty show
//! three days from now does not drag the number down
const averageOccupancy = async (from) => {
    const measure = async (start, end) => {
        const showtimes = await Showtime.find({
            status: { $ne: 'cancelled' },
            startsAt: { $gte: start, $lt: end },
        }).populate('hall', 'seatMap').select('hall');

        if (!showtimes.length) return 0;

        const sold = await Booking.aggregate([
            { $match: { ...SETTLED, showtime: { $in: showtimes.map(s => s._id) } } },
            { $group: { _id: '$showtime', seats: { $sum: { $size: '$seats' } } } },
        ]);
        const soldBy = new Map(sold.map(row => [String(row._id), row.seats]));

        let capacity = 0, taken = 0;
        showtimes.forEach(showtime => {
            const seats = showtime.hall && showtime.hall.totalSeats;
            if (!seats) return;
            capacity += seats;
            taken += soldBy.get(String(showtime._id)) || 0;
        });

        return capacity ? Math.round((taken / capacity) * 100) : 0;
    };

    const span = Date.now() - from.getTime();
    const [current, previous] = await Promise.all([
        measure(from, new Date()),
        measure(new Date(from.getTime() - span), from),
    ]);

    return { current, previous };
};


/**
 * The box office. Nothing in the API listed bookings beyond your own, so an
 * operator could not see the till at all.
 */
exports.getBookings = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.payment) filter['payment.status'] = req.query.payment;
        if (req.query.code) filter.bookingCode = new RegExp(`^${escapeRegex(req.query.code)}`, 'i');
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
            if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
        }

        const [bookings, total, totals] = await Promise.all([
            Booking.find(filter)
                .populate(BOOKING_POPULATE)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Booking.countDocuments(filter),
            settledTotals(filter),
        ]);

        res.status(200).json({
            status: 200,
            message: "Bookings fetched successfully",
            bookings,
            totals,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! the strip above the table: what the current filter is actually worth
const settledTotals = async (filter) => {
    const [row] = await Booking.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                settled: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.amount', 0] } },
                refunded: { $sum: { $cond: [{ $eq: ['$payment.status', 'refunded'] }, '$payment.amount', 0] } },
            },
        },
    ]);

    return {
        settled: row ? Math.round(row.settled * 100) / 100 : 0,
        refunded: row ? Math.round(row.refunded * 100) / 100 : 0,
    };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


/**
 * Refunds go through the gateway, never by editing a status. Anything else
 * would leave our database claiming something Stripe disagrees with.
 */
exports.refundBooking = async (req, res) => {
    if (!isConfigured()) {
        return res.status(503).json({ status: 503, message: "Payments aren't set up on this server yet." });
    }

    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        if (booking.payment.status === 'refunded') {
            return res.status(200).json({ status: 200, message: "This booking was already refunded", booking });
        }
        if (booking.payment.status !== 'paid' || !booking.payment.intentId) {
            return res.status(409).json({ status: 409, message: "There is no settled payment to refund" });
        }

        await stripe.refunds.create({ payment_intent: booking.payment.intentId });

        //! releasing the seats is the other half of a refund — a refunded
        //! booking that still holds its row would sell nothing to anyone
        await BookedSeat.deleteMany({ booking: booking._id });

        const updated = await Booking.findByIdAndUpdate(
            booking._id,
            {
                $set: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    expiresAt: null,
                    'payment.status': 'refunded',
                    'payment.refundedAt': new Date(),
                    'payment.refundReason': req.body.reason || 'refunded by an administrator',
                },
            },
            { new: true }
        ).populate(BOOKING_POPULATE);

        res.status(200).json({ status: 200, message: "Refunded and seats released", booking: updated });
    } catch (error) {
        console.error('[admin] refund failed:', error.message);
        res.status(500).json({ status: 500, message: "Couldn't refund that booking." });
    }
};


/**
 * The user list. The old /user/users returned every document in the
 * collection, unpaged and unfiltered, including fields nobody outside the
 * account owns any business seeing.
 */
exports.getUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.search) {
            const term = new RegExp(escapeRegex(req.query.search), 'i');
            filter.$or = [{ fullName: term }, { email: term }];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('fullName email role subscription')
                .sort({ _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        //! joined-on is free: it is already encoded in the id
        const withDates = users.map(user => ({
            ...user.toObject(),
            joinedAt: user._id.getTimestamp(),
        }));

        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            users: withDates,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.setUserRole = async (req, res) => {
    const { role } = req.body;

    try {
        //! an admin removing their own last privilege would lock everyone out
        if (req.params.id === req.user.id && role !== 'admin') {
            return res.status(409).json({ status: 409, message: "You can't remove your own admin access" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role } },
            { new: true, runValidators: true }
        ).select('fullName email role');

        if (!user) return res.status(404).json({ status: 404, message: "User not found" });

        res.status(200).json({ status: 200, message: `${user.fullName} is now ${role === 'admin' ? 'an administrator' : 'a member'}`, user });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Catalogue lists for the admin tables: paged, searchable, sortable, and with
//! the review average folded in so the table can sort by rating.
const catalogueList = (Model, extraProjection = {}) => async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const match = {};
        if (req.query.category) match.category = req.query.category;
        if (req.query.search) match.title = new RegExp(escapeRegex(req.query.search), 'i');

        const sortField = ['title', 'views', 'rate', 'createdAt'].includes(req.query.sort)
            ? req.query.sort
            : 'createdAt';
        const direction = req.query.order === 'asc' ? 1 : -1;
        //! documents predate timestamps, so "newest" falls back to the id,
        //! which carries the same information
        const sort = sortField === 'createdAt' ? { _id: direction } : { [sortField]: direction };

        const [items, total] = await Promise.all([
            Model.aggregate([
                { $match: match },
                { $lookup: { from: 'reviews', localField: '_id', foreignField: 'media', as: 'reviews' } },
                {
                    $project: {
                        title: 1, thumbnail: 1, views: 1, category: 1, country: 1, language: 1,
                        rate: { $avg: '$reviews.rating' },
                        reviewCount: { $size: '$reviews' },
                        ...extraProjection,
                    },
                },
                { $sort: sort },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ]),
            Model.countDocuments(match),
        ]);

        res.status(200).json({
            status: 200,
            message: "Fetched successfully",
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getMovies = catalogueList(Movie, { duration: 1, director: 1 });
exports.getSeries = catalogueList(Series, { seasons: { $size: { $ifNull: ['$seasons', []] } } });


//! Review moderation. Deleting a review is otherwise limited to its author, so
//! nothing abusive could be taken down.
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ status: 404, message: "Review not found" });

        res.status(200).json({ status: 200, message: "Review removed" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! a review stores a bare media id with no hint of which collection it came
//! from, so moderation has to look in both to say what was reviewed
const resolveReviewMedia = async (reviews) => {
    const ids = [...new Set(reviews.map(review => String(review.media)))]
        .map(id => new mongoose.Types.ObjectId(id));

    const [movies, series] = await Promise.all([
        Movie.find({ _id: { $in: ids } }).select('title thumbnail').lean(),
        Series.find({ _id: { $in: ids } }).select('title thumbnail').lean(),
    ]);

    const byId = new Map();
    movies.forEach(doc => byId.set(String(doc._id), { ...doc, kind: 'Movies' }));
    series.forEach(doc => byId.set(String(doc._id), { ...doc, kind: 'Series' }));
    return byId;
};

exports.getReviews = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const [reviews, total] = await Promise.all([
            //! the reviewer's name and email live on the review itself, which is
            //! what moderation needs — the account link is only populated when
            //! there is one, since reviews written before it was added have none
            Review.find()
                .populate('user', 'fullName email role')
                .sort({ _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(),
        ]);

        const media = await resolveReviewMedia(reviews);

        res.status(200).json({
            status: 200,
            message: "Reviews fetched successfully",
            reviews: reviews.map(review => ({
                ...review,
                account: review.user || null,
                media: media.get(String(review.media)) || { _id: review.media, title: 'Deleted title' },
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
