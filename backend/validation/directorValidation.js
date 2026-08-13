const joi = require('joi');


const awardsSchema = joi.array().items(joi.object({
    name: joi.string().required(),
    year: joi.number().required(),
}));

exports.createDirectorValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50)
            .required(),
        birthDate: joi.string()
            .required(),
        //! the Director model requires both of these (unlike Actor/Musician,
        //! where they default to "") — joi left them optional, so a director
        //! created without them passed validation here and then failed at the
        //! Mongoose layer with a raw, unfriendly ValidationError instead of a
        //! clean 400
        birthPlace: joi.string()
            .required(),
        country: joi.string()
            .required(),
        bio: joi.string()
            .default(""),
        gender: joi.string()
            .valid("male", "female")
            .required(),
        profile: joi.string()
            .required(),
        awards: awardsSchema,
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
};


exports.editDirectorValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50),
        birthDate: joi.string(),
        birthPlace: joi.string(),
        country: joi.string(),
        bio: joi.string(),
        //! omitted here originally — meant an edit could never touch gender,
        //! and since joi rejects unknown keys by default, submitting it at all
        //! failed the WHOLE save, not just that one field
        gender: joi.string()
            .valid("male", "female"),
        profile: joi.string(),
        awards: awardsSchema,
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}