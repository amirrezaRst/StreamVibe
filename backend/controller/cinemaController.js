const Cinema = require('../model/cinemaModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');
const { escapeRegex } = require('../utils/escapeRegex');


//! Get Request
exports.getCities = async (req, res) => {
    try {
        const cities = await Cinema.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: { city: '$city', country: '$country' }, cinemaCount: { $sum: 1 } } },
            {
                $project: {
                    _id: 0,
                    city: '$_id.city',
                    country: '$_id.country',
                    cinemaCount: 1,
                }
            },
            { $sort: { city: 1 } }
        ]);

        res.status(200).json({ status: 200, message: "Cities fetched successfully", cities });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getCinemas = async (req, res) => {
    const { city, country } = req.query;

    try {
        const filter = { isActive: true };
        if (city) filter.city = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');
        if (country) filter.country = new RegExp(`^${escapeRegex(country.trim())}$`, 'i');

        const cinemas = await Cinema.find(filter).sort({ name: 1 });

        res.status(200).json({ status: 200, message: "Cinemas fetched successfully", total: cinemas.length, cinemas });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id);
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        const halls = await Hall.find({ cinema: cinema._id }).sort({ name: 1 });

        res.status(200).json({ status: 200, message: "Cinema fetched successfully", cinema, halls });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Post Request
exports.createCinema = async (req, res) => {
    try {
        const cinema = await Cinema.create(req.body);
        res.status(201).json({ status: 201, message: "Cinema created successfully", cinema });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Put Request
exports.updateCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        res.status(200).json({ status: 200, message: "Cinema updated successfully", cinema });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Delete Request
exports.deleteCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id);
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        //! a cinema with screenings on the books can't just vanish — those showtimes
        //! may already have bookings against them
        const upcoming = await Showtime.countDocuments({
            cinema: cinema._id,
            startsAt: { $gte: new Date() },
            status: 'scheduled'
        });
        if (upcoming > 0) {
            return res.status(409).json({
                status: 409,
                message: `This cinema has ${upcoming} upcoming showtime(s). Cancel them before deleting it.`
            });
        }

        await Hall.deleteMany({ cinema: cinema._id });
        await cinema.deleteOne();

        res.status(200).json({ status: 200, message: "Cinema deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
