const joi = require('joi');
const normalizeArrayFields = require('../utils/normalizeArrayFields');

const QUALITIES = ['360p', '480p', '720p', '1080p', '4K'];

//! shared by create and update: turns the uploaded `files` field plus the
//! parallel `fileQualities` field (a JSON array, same order as the files were
//! appended) into the {quality, url} shape the schema — every file is tagged
//! with the quality it actually is, not a hardcoded guess, because the
//! plan-gating ladder in constants/plans.js enforces against this tag
const mapUploadedFiles = (req) => {
    //! always stripped, even when there are no files — it's not part of the
    //! schema, and joi rejects unknown keys by default
    const rawQualities = req.body.fileQualities;
    delete req.body.fileQualities;

    if (!req.files.files) return { files: undefined, error: null };

    let qualities;
    try {
        qualities = JSON.parse(rawQualities || '[]');
    } catch {
        return { files: null, error: 'fileQualities must be a JSON array' };
    }

    if (!Array.isArray(qualities) || qualities.length !== req.files.files.length) {
        return { files: null, error: 'fileQualities must list exactly one quality per uploaded file, in the same order' };
    }

    const invalid = qualities.find(q => !QUALITIES.includes(q));
    if (invalid) return { files: null, error: `"${invalid}" is not a valid quality` };

    return {
        files: req.files.files.map((file, index) => ({ quality: qualities[index], url: file.filename })),
        error: null,
    };
};

exports.createMovieValidation = (req, res, next) => {
    normalizeArrayFields(req.body, ['genres', 'category', 'actors']);

    if (!req.files.thumbnail) return res.status(400).json({ status: 400, message: "Thumbnail is required" });
    const thumbnailUrl = req.files.thumbnail[0].filename;

    if (!req.files.trailer) return res.status(400).json({ status: 400, message: "Trailer is required" });
    const trailerUrl = req.files.trailer[0].filename;

    if (!req.files.cover) return res.status(400).json({ status: 400, message: "Cover is required" });
    const coverUrl = req.files.cover[0].filename

    const { files, error: fileError } = mapUploadedFiles(req);
    if (fileError) return res.status(400).json({ status: 400, message: fileError });
    if (files) req.body.files = files;

    req.body.thumbnail = thumbnailUrl;
    req.body.trailer = trailerUrl;
    req.body.cover = coverUrl;

    const schema = joi.object({
        title: joi.string().required(),
        description: joi.string(),
        director: joi.string().required(),
        release_date: joi.string().required(),
        duration: joi.number().required(),
        genres: joi.array().items(joi.string()).required(),
        category: joi.array().items(joi.string()).required(),
        country: joi.string().required(),
        language: joi.string().required(),
        //! the Movie model itself requires this — joi used to let it through
        //! and leave the mongoose ValidationError to surface as a raw 500
        age_rating: joi.string().required(),
        production_company: joi.string(),
        rotten_rating: joi.number().required(),
        imdb_rating: joi.number().required(),
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
        files: joi.array().items(joi.object({
            quality: joi.string().valid(...QUALITIES).required(),
            url: joi.string().required()
        }))
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
}

/**
 * The edit form can add new video files to a movie that already has some —
 * `updateMovie` appends these onto the existing `files` array rather than
 * replacing it, so re-saving the form after adding a 4K file doesn't silently
 * drop the 1080p one that was already there.
 */
exports.updateMovieValidation = (req, res, next) => {
    normalizeArrayFields(req.body, ['genres', 'category', 'actors', 'removeFileUrls']);

    if (req.files?.thumbnail) req.body.thumbnail = req.files.thumbnail[0].filename;
    if (req.files?.trailer) req.body.trailer = req.files.trailer[0].filename;
    if (req.files?.cover) req.body.cover = req.files.cover[0].filename;

    if (req.files?.files) {
        const { files, error: fileError } = mapUploadedFiles(req);
        if (fileError) return res.status(400).json({ status: 400, message: fileError });
        req.body.newFiles = files;
    }
    delete req.body.files;

    const schema = joi.object({
        title: joi.string(),
        description: joi.string().allow(''),
        director: joi.string(),
        release_date: joi.string(),
        duration: joi.number(),
        genres: joi.array().items(joi.string()),
        category: joi.array().items(joi.string()),
        country: joi.string(),
        language: joi.string(),
        age_rating: joi.string(),
        production_company: joi.string().allow(''),
        rotten_rating: joi.number(),
        imdb_rating: joi.number(),
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
        newFiles: joi.array().items(joi.object({
            quality: joi.string().valid(...QUALITIES).required(),
            url: joi.string().required()
        })),
        removeFileUrls: joi.array().items(joi.string()),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details.map(d => d.message) });

    next();
} 