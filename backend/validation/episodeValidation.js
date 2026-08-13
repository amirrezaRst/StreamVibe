const joi = require('joi');
const normalizeArrayFields = require('../utils/normalizeArrayFields');

const QUALITIES = ['360p', '480p', '720p', '1080p', '4K'];

//! shared by create and update: turns the uploaded `files` field plus the
//! parallel `fileQualities` field (a JSON array, same order as the files were
//! appended) into the {quality, url} shape the schema expects — every file is
//! tagged with the quality it actually is, not a hardcoded guess, because the
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

exports.createEpisodeValidation = (req, res, next) => {
    if (req.files.pictures) {
        const pictureUrls = req.files.pictures.map(picture => picture.filename);
        req.body.pictures = pictureUrls;
    }
    else return res.status(400).json({ status: 400, message: "Pictures are required" });

    //! unlike pictures, files are not required — an episode's metadata can
    //! exist before its video does, same as a movie's
    const { files, error: fileError } = mapUploadedFiles(req);
    if (fileError) return res.status(400).json({ status: 400, message: fileError });
    if (files) req.body.files = files;

    const schema = joi.object({
        title: joi.string().required(),
        description: joi.string(),
        releaseDate: joi.string(),
        runtime: joi.number().required(),
        episodeNumber: joi.number().required(),
        seasonNumber: joi.number().required(),
        seriesTitle: joi.string().required(),
        series: joi.string().required(),
        pictures: joi.array().items(joi.string().required()).required(),
        files: joi.array().items(joi.object({
            quality: joi.string().valid(...QUALITIES).required(),
            url: joi.string().required()
        }))
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details[0].message });

    next();
}

/**
 * Mirrors updateMovieValidation: new files are appended by the controller
 * rather than replacing whatever the episode already has.
 */
exports.updateEpisodeValidation = (req, res, next) => {
    normalizeArrayFields(req.body, ['removeFileUrls']);

    if (req.files?.pictures) req.body.pictures = req.files.pictures.map(p => p.filename);

    if (req.files?.files) {
        const { files, error: fileError } = mapUploadedFiles(req);
        if (fileError) return res.status(400).json({ status: 400, message: fileError });
        req.body.newFiles = files;
    }
    delete req.body.files;

    const schema = joi.object({
        title: joi.string(),
        description: joi.string().allow(''),
        releaseDate: joi.string(),
        runtime: joi.number(),
        episodeNumber: joi.number(),
        seasonNumber: joi.number(),
        //! not an Episode field — only present so multer's filename()
        //! callback can name a per-file upload request the same way it would
        //! at create time. Mongoose's strict-by-default schema drops it
        //! silently on $set, same as it would any other unknown key.
        seriesTitle: joi.string(),
        pictures: joi.array().items(joi.string()),
        newFiles: joi.array().items(joi.object({
            quality: joi.string().valid(...QUALITIES).required(),
            url: joi.string().required()
        })),
        removeFileUrls: joi.array().items(joi.string()),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 400, message: error.details[0].message });

    next();
}
