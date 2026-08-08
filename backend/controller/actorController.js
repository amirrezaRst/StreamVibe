const path = require('path');
const { creditsFor, collaboratorsFrom } = require('../utils/personCredits');

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
        //! resolved by the slug middleware, so this is already the record
        const actor = req.record;

        const credits = await creditsFor({ actors: actor._id });
        const collaborators = await collaboratorsFrom(credits, { role: 'actor', excludeId: actor._id });

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            actor,
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
        const actor = req.record;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const credits = await creditsFor({ actors: actor._id }, { limit, skip: (page - 1) * limit });
        const total = await CreditModel.countDocuments({ actors: actor._id });
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: 200,
            message: "Fetch data successfully",
            actor: { fullName: actor.fullName, slug: actor.slug },
            [key]: credits[key],
            pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages },
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
};

exports.getActorMovies = paginatedCredits(Movie, 'movies');
exports.getActorSeries = paginatedCredits(Series, 'series');


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