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

exports.verifyCheckoutValidation = (req, res, next) => {
    const schema = joi.object({
        //! Stripe's own format for a Checkout session; anything else cannot be
        //! one, so it is turned away before it costs an API call
        sessionId: joi.string()
            .pattern(/^cs_[A-Za-z0-9_]+$/)
            .required()
            .messages({ 'string.pattern.base': 'That is not a valid payment session' }),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};
