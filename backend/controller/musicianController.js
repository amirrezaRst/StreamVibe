const path = require('path');

const Musician = require('../model/musicianModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const { creditsFor, collaboratorsFrom } = require('../utils/personCredits');
const { paginatedPeople } = require('../utils/personList');
const uploadImage = require('../utils/upload');
const { createMusicianValidation, editMusicianValidation } = require('../validation/musicianValidation');
const { deleteFileIfExists } = require('../utils/fileUtils');

/**
 * Composers, read the same way directors are. The person page renders all
 * three roles through one layout, so these responses deliberately match the
 * shape the actor and director endpoints return.
 */

//! config uploader
const upload = uploadImage({
    fieldName: "profile",
    fileSize: "4000000",
    destination: '../public/musician/',
    width: 600,
    height: 600,
    quality: 80
});

exports.allMusicians = async (req, res) => {
    try {
        const musicians = await Musician.find().select('fullName slug profile country birthDate');
        res.status(200).json({ status: 200, message: 'fetch data successfully', musicians });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! the /musicians browse page — paginated, name-searchable, unlike allMusicians above
exports.browseMusicians = paginatedPeople(Musician);

exports.getMusician = async (req, res) => {
    try {
        //! resolved by the slug middleware, so this is already the record
        const musician = req.record;

        const credits = await creditsFor({ musician: musician._id });
        const collaborators = await collaboratorsFrom(credits, { role: 'musician', excludeId: musician._id });

        res.status(200).json({
            status: 200,
            message: 'fetch data successfully',
            musician,
            ...credits,
            collaborators,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const paginatedCredits = (Model, key) => async (req, res) => {
    try {
        const musician = req.record;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const credits = await creditsFor({ musician: musician._id }, { limit, skip: (page - 1) * limit });
        const total = await Model.countDocuments({ musician: musician._id });
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: 200,
            message: 'Fetch data successfully',
            musician: { fullName: musician.fullName, slug: musician.slug },
            [key]: credits[key],
            pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getMusicianMovies = paginatedCredits(Movie, 'movies');
exports.getMusicianSeries = paginatedCredits(Series, 'series');


//! Post Request
exports.createMusician = [upload, createMusicianValidation, async (req, res) => {
    try {
        const newMusician = await Musician.create(req.body);
        res.status(201).json({
            status: 201, message: "Musician created", musician: newMusician
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}];


//! Put Request
exports.updateMusician = [upload, editMusicianValidation, async (req, res) => {
    const musicianId = req.params.id;

    try {
        const musician = await Musician.findById(musicianId);
        if (!musician) return res.status(404).json({ status: 404, message: "Musician not found" });

        //! only when a replacement actually arrived — otherwise an edit that
        //! leaves the photo alone would delete the one already on disk
        if (req.body.profile && musician.profile) {
            await deleteFileIfExists(path.join(__dirname, '../public/musician/', musician.profile));
        }

        const updatedMusician = await Musician.findByIdAndUpdate(musicianId, req.body, {
            new: true,
        });

        res.status(200).json({ status: 200, message: "Musician updated", musician: updatedMusician });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}];


//! Delete Request
exports.deleteMusician = async (req, res) => {
    const musicianId = req.params.id;

    try {
        const musician = await Musician.findByIdAndDelete(musicianId);
        if (!musician) {
            return res.status(404).json({ status: 404, message: "Musician not found" });
        }
        if (musician.profile) {
            await deleteFileIfExists(path.join(__dirname, '../public/musician/', musician.profile));
        }

        res.status(200).json({ status: 200, message: "Musician deleted" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}
