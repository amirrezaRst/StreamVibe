const joi = require('joi');

exports.likeValidation = (req, res, next) => {
    const schema = joi.object({
        media: joi.string().required()
    });
    const { error } = schema.validate(req.body);

    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}


exports.unlikeValidation = (req, res, next) => {
    const schema = joi.object({
        media: joi.string().required()
    });
    const { error } = schema.validate(req.body);

    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}


