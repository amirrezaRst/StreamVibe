const Musician = require('../model/musicianModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const { creditsFor, collaboratorsFrom } = require('../utils/personCredits');

/**
 * Composers, read the same way directors are. The person page renders all
 * three roles through one layout, so these responses deliberately match the
 * shape the actor and director endpoints return.
 */

exports.allMusicians = async (req, res) => {
    try {
        const musicians = await Musician.find().select('fullName slug profile country birthDate');
        res.status(200).json({ status: 200, message: 'fetch data successfully', musicians });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

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
