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

//? Profile Validation
exports.updateProfileValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50),
        email: joi.string()
            .email()
            .trim()
            .lowercase(),
    })
        //! an empty body would silently "succeed" without changing anything
        .min(1);

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    //! joi normalises here (trim/lowercase), so hand the cleaned values forward
    req.body = value;
    next();
};

exports.changePasswordValidation = (req, res, next) => {
    const schema = joi.object({
        currentPassword: joi.string()
            .required(),
        newPassword: joi.string()
            .min(8)
            .max(50)
            .required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

//? Watchlist Validation
exports.watchListValidation = (req, res, next) => {
    const schema = joi.object({
        kind: joi.string()
            .valid('Movies', 'Series')
            .required(),
        item: joi.string()
            .hex()
            .length(24)
            .required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

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