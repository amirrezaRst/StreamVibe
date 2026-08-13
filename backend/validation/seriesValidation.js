const joi = require('joi');
const normalizeArrayFields = require('../utils/normalizeArrayFields');


exports.createSeriesValidation = (req, res, next) => {
    normalizeArrayFields(req.body, ['genres', 'category', 'actors']);

    if (!req.files.thumbnail) return res.status(400).json({ status: 400, message: "Thumbnail is required" });
    const thumbnailUrl = req.files.thumbnail[0].filename;

    if (!req.files.trailer) return res.status(400).json({ status: 400, message: "Trailer is required" });
    const trailerUrl = req.files.trailer[0].filename;

    if (!req.files.cover) return res.status(400).json({ status: 400, message: "Cover is required" });
    const coverUrl = req.files.cover[0].filename

    req.body.thumbnail = thumbnailUrl;
    req.body.trailer = trailerUrl;
    req.body.cover = coverUrl;

    const schema = joi.object({
        title: joi.string().required(),
        description: joi.string(),
        director: joi.string().required(),
        release_date: joi.string().required(),
        genres: joi.array().items(joi.string()).required(),
        category: joi.array().items(joi.string()).required(),
        country: joi.string().required(),
        language: joi.string().required(),
        ageRating: joi.string(),
        production_company: joi.string(),
        rotten_rating: joi.number().required(),
        imdb_rating: joi.number().required(),
        age_rating: joi.string(),
        awards: joi.array().items(joi.object({
            name: joi.string().required(),
            year: joi.string().required()
        })),
        boxOffice: joi.object({
            budget: joi.number(),
            gross: joi.number()
        }),
        top250rank: joi.number().min(1).max(250),
        release_status: joi.string().valid('now showing', 'coming soon', 'expired').default('now showing'),
        actors: joi.array().items(joi.string()),
        thumbnail: joi.string().required(),
        trailer: joi.string().required(),
        cover: joi.string().required(),
        pictures: joi.array().items(joi.string()),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}

exports.updateSeriesValidation = (req, res, next) => {
    normalizeArrayFields(req.body, ['genres', 'category', 'actors']);

    if (req.files?.thumbnail) req.body.thumbnail = req.files.thumbnail[0].filename;
    if (req.files?.trailer) req.body.trailer = req.files.trailer[0].filename;
    if (req.files?.cover) req.body.cover = req.files.cover[0].filename;

    const schema = joi.object({
        title: joi.string(),
        description: joi.string().allow(''),
        director: joi.string(),
        release_date: joi.string(),
        genres: joi.array().items(joi.string()),
        category: joi.array().items(joi.string()),
        country: joi.string(),
        language: joi.string(),
        ageRating: joi.string(),
        production_company: joi.string().allow(''),
        rotten_rating: joi.number(),
        imdb_rating: joi.number(),
        age_rating: joi.string(),
        awards: joi.array().items(joi.object({
            name: joi.string().required(),
            year: joi.string().required()
        })),
        boxOffice: joi.object({
            budget: joi.number(),
            gross: joi.number()
        }),
        top250rank: joi.number().min(1).max(250).allow(null),
        release_status: joi.string().valid('now showing', 'coming soon', 'expired'),
        actors: joi.array().items(joi.string()),
        thumbnail: joi.string(),
        trailer: joi.string(),
        cover: joi.string(),
        pictures: joi.array().items(joi.string()),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
} 