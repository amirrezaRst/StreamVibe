const path = require('path');
const { creditsFor, collaboratorsFrom } = require('../utils/personCredits');

const Director = require('../model/directorModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const uploadImage = require('../utils/upload');
const { createDirectorValidation, editDirectorValidation } = require('../validation/directorValidation');
const { deleteFileIfExists } = require('../utils/fileUtils');


//! config uploader
const upload = uploadImage({
    fieldName: "profile",
    fileSize: "4000000",
    destination: '../public/director/',
    width: 600,
    height: 600,
    quality: 80
});




exports.getAllDirectors = async (req, res) => {
    try {
        const directors = await Director.find();
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            results: directors.length,
            directors
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};

exports.getDirector = async (req, res) => {
    try {
        //! resolved by the slug middleware, so this is already the record
        const director = req.record;

        const credits = await creditsFor({ director: director._id });
        const collaborators = await collaboratorsFrom(credits, { role: 'director', excludeId: director._id });

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            director,
            ...credits,
            collaborators,
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
};

//! the paginated "see all" page behind each carousel
const paginatedCredits = (CreditModel, key) => async (req, res) => {
    try {
        const director = req.record;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const credits = await creditsFor({ director: director._id }, { limit, skip: (page - 1) * limit });
        const total = await CreditModel.countDocuments({ director: director._id });
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            director: { fullName: director.fullName, slug: director.slug },
            [key]: credits[key],
            pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages },
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
};

exports.getDirectorMovies = paginatedCredits(Movie, 'movies');
exports.getDirectorSeries = paginatedCredits(Series, 'series');


exports.createDirector = [upload, createDirectorValidation, async (req, res) => {
    try {
        const newDirector = await Director.create(req.body);
        res.status(201).json({
            status: 201,
            message: "Director created successfully",
            director: newDirector
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}];

exports.updateDirector = [upload, editDirectorValidation, async (req, res) => {
    const directorId = req.params.id;

    try {
        const director = await Director.findById(directorId);
        if (!director) return res.status(404).json({ status: 404, message: "Director not found" });

        if (req.body.profile && director.profile) {
            await deleteFileIfExists(path.join(__dirname, '../public/director/', director.profile));
        }

        const updatedDirector = await Director.findByIdAndUpdate(directorId, req.body, {
            new: true,
        });

        res.status(200).json({ status: 200, message: "Director updated", director: updatedDirector });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
}];

exports.deleteDirector = async (req, res) => {
    try {
        const director = await Director.findByIdAndDelete(req.params.id);
        if (!director) {
            return res.status(404).json({ status: 404, message: "Actor not found" })
        }
        res.status(200).json({
            status: 204,
            message: "Director deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};