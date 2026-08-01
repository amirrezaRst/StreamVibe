const path = require('path');

const { createActorValidation, editActorValidation } = require('../validation/actorValidation');
const Actor = require('../model/actorModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const uploadImage = require('../utils/upload');
const { deleteFileIfExists } = require('../utils/fileUtils');

//! config uploader
const upload = uploadImage({
    fieldName: "profile",
    fileSize: "4000000",
    destination: '../public/actor',
    width: 600,
    height: 600,
    quality: 80
})


//! Get Request
exports.allActors = async (req, res) => {
    try {
        const actors = await Actor.find();
        res.status(200).json({ status: 200, actors, message: "All actors" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// exports.getActor = async (req, res) => {
//     const actorId = req.params.id;

//     try {
//         const actor = await Actor.findById(actorId);
//         if (!actor) {
//             return res.status(404).json({ message: "Actor not found" });
//         }
//         res.status(200).json({ status: 200, actor, message: "Actor found" });
//     } catch (error) {
//         res.status(500).json({ status: 500, message: error.message });
//     }
// };

exports.getActor = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id);
        if (!actor) return res.status(404).json({ status: 404, message: "Director not found" });

        const movies = await Movie.aggregate([
            { $match: { actors: actor._id } },
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
                    rate: 1,
                    actors: 1
                }
            }
        ]);

        const series = await Series.aggregate([
            { $match: { actors: actor._id } },
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
            actor,
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


exports.getActorMovies = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id).select("fullName");
        if (!actor) return res.status(404).json({ status: 404, message: "Actor not found" });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const movies = await Movie.aggregate([
            { $match: { actors: actor._id } },
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

        const totalMovies = await Movie.countDocuments({ actors: actor._id });
        const totalPages = Math.ceil(totalMovies / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            actor,
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


exports.getActorSeries = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id).select("fullName");
        if (!actor) return res.status(404).json({ status: 404, message: "Actor not found" });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const series = await Series.aggregate([
            { $match: { actors: actor._id } },
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

        const totalSeries = await Series.countDocuments({ actors: actor._id });
        const totalPages = Math.ceil(totalSeries / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            actor,
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


//! Post Request
exports.createActor = [upload, createActorValidation, async (req, res) => {
    try {
        const newActor = await Actor.create(req.body);
        res.status(201).json({
            status: 201, message: "Actor created", actor: newActor
        });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}];



//! Put Request
exports.updateActor = [upload, editActorValidation, async (req, res) => {
    const actorId = req.params.id;

    try {
        const actor = await Actor.findById(actorId);
        if (!actor) return res.status(404).json({ status: 404, message: "Actor not found" });

        if (req.body.profile && actor.profile) {
            await deleteFileIfExists(path.join(__dirname, '../public/actor/', actor.profile));
        }

        const updatedActor = await Actor.findByIdAndUpdate(actorId, req.body, {
            new: true,
        });

        res.status(200).json({ status: 200, message: "Actor updated", actor: updatedActor });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}];



//! Delete Request
exports.deleteActor = async (req, res) => {
    const actorId = req.params.id;

    try {
        const actor = await Actor.findByIdAndDelete(actorId);
        if (!actor) {
            return res.status(404).json({ status: 404, message: "Actor not found" });
        }
        if (actor.profile) {
            await deleteFileIfExists(path.join(__dirname, '../public/actor/', actor.profile));
        }

        res.status(200).json({ status: 200, message: "Actor deleted" });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}