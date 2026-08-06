const joi = require('joi');
const { SEAT_TIERS } = require('../constants/seatTiers');

const runValidation = (schema, req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

const cinemaFields = {
    name: joi.string().min(2).max(100),
    city: joi.string().min(2).max(60),
    country: joi.string().min(2).max(60),
    address: joi.string().min(4).max(200),
    location: joi.object({
        lat: joi.number().min(-90).max(90),
        lng: joi.number().min(-180).max(180),
    }),
    image: joi.string().allow(''),
    amenities: joi.array().items(joi.string()),
    isActive: joi.boolean(),
};

exports.createCinemaValidation = (req, res, next) => runValidation(
    joi.object({
        ...cinemaFields,
        name: cinemaFields.name.required(),
        city: cinemaFields.city.required(),
        country: cinemaFields.country.required(),
        address: cinemaFields.address.required(),
    }),
    req, res, next
);

exports.updateCinemaValidation = (req, res, next) => runValidation(
    joi.object(cinemaFields).min(1),
    req, res, next
);


const seatSchema = joi.object({
    number: joi.number().integer().min(1).required(),
    tier: joi.string().valid(...SEAT_TIERS),
    disabled: joi.boolean(),
});

const rowSchema = joi.object({
    row: joi.string().max(3).required(),
    seats: joi.array().items(seatSchema).min(1).required(),
});

const hallFields = {
    cinema: joi.string(),
    name: joi.string().min(1).max(60),
    screenType: joi.string().valid('2D', '3D', 'IMAX', '4DX'),
    seatMap: joi.array().items(rowSchema),
};

exports.createHallValidation = (req, res, next) => runValidation(
    joi.object({
        ...hallFields,
        cinema: hallFields.cinema.required(),
        name: hallFields.name.required(),
        //! A room can exist before it is laid out — a venue manager adds the
        //! hall, then shapes it. The read layer and the console already treat
        //! "no seat map yet, not bookable" as a real state; requiring a map
        //! here was the one place that disagreed.
        seatMap: hallFields.seatMap.default([]),
    }),
    req, res, next
);

exports.updateHallValidation = (req, res, next) => runValidation(
    joi.object(hallFields).min(1),
    req, res, next
);


//! at least the standard tier must be priced; the others are optional so a hall
//! with no vip seats doesn't have to carry a meaningless vip price
const pricingSchema = joi.object(
    SEAT_TIERS.reduce((fields, tier) => {
        fields[tier] = joi.number().min(0);
        return fields;
    }, {})
).min(1);

const showtimeFields = {
    movie: joi.string(),
    hall: joi.string(),
    startsAt: joi.date().iso(),
    pricing: pricingSchema,
    language: joi.string().valid('original', 'dubbed', 'subtitled'),
    currency: joi.string().length(3).uppercase(),
    status: joi.string().valid('scheduled', 'cancelled'),
};

exports.createShowtimeValidation = (req, res, next) => runValidation(
    joi.object({
        ...showtimeFields,
        movie: showtimeFields.movie.required(),
        hall: showtimeFields.hall.required(),
        startsAt: showtimeFields.startsAt.required(),
        pricing: pricingSchema.required(),
    }),
    req, res, next
);

exports.updateShowtimeValidation = (req, res, next) => runValidation(
    joi.object(showtimeFields).min(1),
    req, res, next
);

//! A run: the same slot repeated. Capped at 60 so a typo in the count cannot
//! fill a hall's calendar for two months in one request.
exports.createShowtimeRunValidation = (req, res, next) => runValidation(
    joi.object({
        ...showtimeFields,
        movie: showtimeFields.movie.required(),
        hall: showtimeFields.hall.required(),
        startsAt: showtimeFields.startsAt.required(),
        pricing: pricingSchema.required(),
        repeat: joi.string().valid('daily', 'weekly').required(),
        occurrences: joi.number().integer().min(2).max(60).required(),
    }),
    req, res, next
);
