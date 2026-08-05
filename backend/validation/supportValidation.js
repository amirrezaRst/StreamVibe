const joi = require('joi');


exports.createSupportTicketValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string().required(),
        email: joi.string().email().required(),
        subject: joi.string().required(),
        message: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};


exports.setSupportStatusValidation = (req, res, next) => {
    const schema = joi.object({
        status: joi.string()
            .valid('pending', 'in progress', 'resolved')
            .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details[0].message });

    next();
};


exports.updateSupportTicketValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string().required(),
        email: joi.string().email(),
        status: joi.string().valid('pending', 'in progress', 'resolved'),
        subject: joi.string().required(),
        message: joi.string(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
}