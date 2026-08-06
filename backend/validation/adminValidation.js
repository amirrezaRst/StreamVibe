const joi = require('joi');

exports.setUserRoleValidation = (req, res, next) => {
    const schema = joi.object({
        role: joi.string()
            .valid('user', 'admin')
            .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};

exports.refundValidation = (req, res, next) => {
    const schema = joi.object({
        //! kept for the record on the booking, so a refund a month later still
        //! says why it happened
        reason: joi.string().max(200),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};
