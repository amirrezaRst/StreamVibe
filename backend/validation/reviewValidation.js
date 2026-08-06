const joi = require('joi');
const { REVIEW_STATUSES } = require('../constants/review');


exports.createReviewValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string().required(),
        email: joi.string().required(),
        text: joi.string().required(),
        rating: joi.number().required(),
        media: joi.string().required(),
        //! the author's own "this gives something away" tick
        spoiler: joi.boolean(),
    })
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};


exports.moderateReviewValidation = (req, res, next) => {
    const schema = joi.object({
        status: joi.string()
            .valid(...REVIEW_STATUSES)
            .required(),
        //! only meaningful on a rejection, and only so the author can be told
        //! something more useful than "no"
        reason: joi.string()
            .max(200)
            .when('status', { is: 'rejected', then: joi.optional(), otherwise: joi.forbidden() }),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};


exports.moderateManyValidation = (req, res, next) => {
    const schema = joi.object({
        ids: joi.array()
            .items(joi.string().hex().length(24))
            .min(1)
            //! a cap so a stray request cannot rewrite the whole collection in
            //! one call; the console never selects more than a page anyway
            .max(100)
            .required(),
        status: joi.string()
            .valid(...REVIEW_STATUSES)
            .required(),
        reason: joi.string()
            .max(200)
            .when('status', { is: 'rejected', then: joi.optional(), otherwise: joi.forbidden() }),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};


exports.setSpoilerValidation = (req, res, next) => {
    const schema = joi.object({
        //! null hands the decision back to the author and the readers
        spoiler: joi.boolean().allow(null).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};
