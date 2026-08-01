const Actor = require('../model/actorModel');
const Director = require('../model/directorModel');
const Review = require('../model/reviewModel');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchController = async (req, res) => {
    const { query: rawQuery } = req.body;
    const limit = parseInt(req.query.limit) || 6;

    if (!rawQuery || typeof rawQuery !== 'string') {
        return res.status(400).json({ status: 400, message: "Query is required" });
    }

    const query = escapeRegex(rawQuery.slice(0, 100));

    try {
        const [movieResults, seriesResults, actorResults, directorResults] = await Promise.all([
            Review.aggregate([
                {
                    $lookup: {
                        from: 'movies',
                        localField: 'media',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                { $unwind: '$movieDetails' },
                { $match: { 'movieDetails.title': { $regex: query, $options: 'i' } } },
                {
                    $group: {
                        _id: '$media',
                        rate: { $avg: '$rating' },
                        movieDetails: { $first: '$movieDetails' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: 'movie',
                        data: {
                            _id: '$_id',
                            title: '$movieDetails.title',
                            description: '$movieDetails.description',
                            thumbnail: '$movieDetails.thumbnail',
                            genres: '$movieDetails.genres',
                            rate: '$rate'
                        }
                    }
                },
                { $limit: limit }
            ]),
            Review.aggregate([
                {
                    $lookup: {
                        from: 'series',
                        localField: 'media',
                        foreignField: '_id',
                        as: 'seriesDetails'
                    }
                },
                { $unwind: '$seriesDetails' },
                { $match: { 'seriesDetails.title': { $regex: query, $options: 'i' } } },
                {
                    $group: {
                        _id: '$media',
                        rate: { $avg: '$rating' },
                        seriesDetails: { $first: '$seriesDetails' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: 'series',
                        data: {
                            _id: '$_id',
                            title: '$seriesDetails.title',
                            description: '$seriesDetails.description',
                            thumbnail: '$seriesDetails.thumbnail',
                            genres: '$seriesDetails.genres',
                            rate: '$rate'
                        }
                    }
                },
                { $limit: limit }
            ]),
            Actor.find({ fullName: { $regex: query, $options: 'i' } })
                .select("fullName profile birthDate country birthPlace bio")
                .limit(limit),
            Director.find({ fullName: { $regex: query, $options: 'i' } })
                .select("fullName profile birthDate country birthPlace bio")
                .limit(limit)
        ]);

        const combinedResults = [
            ...movieResults,
            ...seriesResults,
            ...actorResults.map(result => ({ type: 'actor', data: result })),
            ...directorResults.map(result => ({ type: 'director', data: result }))
        ];

        res.status(200).json({
            status: 200,
            message: "Search results fetched successfully",
            results: combinedResults.slice(0, limit)
        });
    } catch (error) {
        console.error("Error fetching search results:", error);
        res.status(500).send({ status: 500, message: "Internal Server Error" });
    }
};

module.exports = searchController;
