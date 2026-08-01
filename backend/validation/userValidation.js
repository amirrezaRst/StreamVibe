const joi = require('joi');

exports.registerValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50)
            .required(),
        email: joi.string()
            .email()
            .trim()
            .lowercase()
            .required(),
        password: joi.string()
            .min(8)
            .max(50)
            .required(),
        remember: joi.boolean()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

exports.loginValidation = (req, res, next) => {
    const schema = joi.object({
        email: joi.string()
            .email()
            .trim()
            .lowercase()
            .required(),
        password: joi.string()
            .min(8)
            .max(50)
            .required(),
        remember: joi.boolean()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

//! must add edit user validation here

//? Password Reset Validation
exports.forgotPasswordValidation = (req, res, next) => {
    const schema = joi.object({
        email: joi.string()
            .email()
            .trim()
            .lowercase()
            .required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

exports.resetPasswordValidation = (req, res, next) => {
    const schema = joi.object({
        password: joi.string()
            .min(8)
            .max(50)
            .required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

//? Subscription Validation
exports.addSubscriptionValidation = (req, res, next) => {
    const schema = joi.object({
        freeTrial: joi.boolean(),
        plan: joi.string()
            .valid('basic', 'standard', 'premium')
            .when("freeTrial", {
                is: true,
                then: joi.optional(),
                otherwise: joi.required(),
            }),
        time: joi.number()
            .when("freeTrial", {
                is: true,
                then: joi.optional(),
                otherwise: joi.required(),
            }),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};