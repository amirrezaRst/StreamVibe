const joi = require('joi');


const awardsSchema = joi.array().items(joi.object({
    name: joi.string().required(),
    year: joi.number().required(),
}));

//! mirrors the Musician model, which follows the Actor pattern rather than
//! the Director one — birthPlace and country default to "" there, so they
//! stay optional here too
exports.createMusicianValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50)
            .required(),
        birthDate: joi.string()
            .required(),
        birthPlace: joi.string()
            .default(""),
        country: joi.string()
            .default(""),
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


exports.editMusicianValidation = (req, res, next) => {
    const schema = joi.object({
        fullName: joi.string()
            .min(3)
            .max(50),
        birthDate: joi.string(),
        birthPlace: joi.string(),
        country: joi.string(),
        bio: joi.string(),
        gender: joi.string()
            .valid("male", "female"),
        profile: joi.string(),
        awards: awardsSchema,
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}
