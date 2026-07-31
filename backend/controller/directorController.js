const fs = require('fs');
const path = require('path');

const Director = require('../model/directorModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const uploadImage = require('../utils/upload');
const { createDirectorValidation, editDirectorValidation } = require('../validation/directorValidation');


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
        const director = await Director.findById(req.params.id);
        if (!director) return res.status(404).json({ status: 404, message: "Director not found" });

        const movies = await Movie.aggregate([
            { $match: { director: director._id } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'media',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rate: { $avg: '$reviews.rating' }
                }
            },
            { $sort: { release_date: -1 } },
            { $limit: 12 },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    views: 1,
                    duration: 1,
                    rate: 1
                }
            }
        ]);

        const series = await Series.aggregate([
            { $match: { director: director._id } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'media',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rate: { $avg: '$reviews.rating' }
                }
            },
            {
                $lookup: {
                    from: 'seasons',
                    localField: '_id',
                    foreignField: 'series',
                    as: 'seasons'
                }
            },
            {
                $addFields: {
                    totalEpisodes: { $sum: { $map: { input: '$seasons', as: 'season', in: { $size: '$$season.episodes' } } } }
                }
            },
            { $sort: { release_date: -1 } },
            { $limit: 12 },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    views: 1,
                    totalEpisodes: 1,
                    rate: 1,
                }
            }
        ]);

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            director,
            movies,
            series
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};



exports.getDirectorMovies = async (req, res) => {
    try {
        const director = await Director.findById(req.params.id).select("fullName");
        if (!director) return res.status(404).json({ status: 404, message: "Director not found" });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const movies = await Movie.aggregate([
            { $match: { director: director._id } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'media',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rate: { $avg: '$reviews.rating' }
                }
            },
            { $sort: { release_date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    views: 1,
                    duration: 1,
                    rate: 1
                }
            }
        ]);

        const totalMovies = await Movie.countDocuments({ director: director._id });
        const totalPages = Math.ceil(totalMovies / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            director,
            movies,
            pagination: {
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};

exports.getDirectorSeries = async (req, res) => {
    try {
        const director = await Director.findById(req.params.id).select("fullName");
        if (!director) return res.status(404).json({ status: 404, message: "Director not found" });

        var { page = 1, limit = 12 } = req.query;
        page = parseInt(page);

        const series = await Series.aggregate([
            { $match: { director: director._id } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'media',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rate: { $avg: '$reviews.rating' }
                }
            },
            {
                $lookup: {
                    from: 'seasons',
                    localField: '_id',
                    foreignField: 'series',
                    as: 'seasons'
                }
            },
            {
                $addFields: {
                    totalEpisodes: { $sum: { $map: { input: '$seasons', as: 'season', in: { $size: '$$season.episodes' } } } }
                }
            },
            { $sort: { release_date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    views: 1,
                    totalEpisodes: 1,
                    rate: 1
                }
            }
        ]);

        const totalSeries = await Series.countDocuments({ director: director._id });
        const totalPages = Math.ceil(totalSeries / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            director,
            series,
            pagination: {
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};

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
            fs.unlinkSync(path.join(__dirname, '../public/director/', director.profile));
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