const joi = require('joi');
const { MAX_SEATS_PER_BOOKING } = require('../constants/booking');

exports.holdSeatsValidation = (req, res, next) => {
    const schema = joi.object({
        showtime: joi.string().required(),
        seats: joi.array()
            .items(joi.string().trim().max(6))
            .min(1)
            .max(MAX_SEATS_PER_BOOKING)
            .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};
