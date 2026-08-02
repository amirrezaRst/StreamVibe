const mongoose = require('mongoose');

const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');

//! the average score isn't stored on the media document, so anything that
//! renders a media card has to fold the reviews in the same way the catalog
//! listings do
const cardPipeline = (ids) => ([
    { $match: { _id: { $in: ids } } },
    {
        $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'media',
            as: 'reviews',
        },
    },
    {
        $project: {
            title: 1,
            thumbnail: 1,
            views: 1,
            rate: { $avg: '$reviews.rating' },
        },
    },
]);

//! Movies and Series live in separate collections, but the watchlist and the
//! liked list mix them freely. Resolve both, tag each result with the kind the
//! client needs to build a link, and hand them back in the order they came in
//! — that order carries meaning (most recently added first).
exports.resolveMedia = async (ids) => {
    if (!ids.length) return [];

    const objectIds = ids.map(id => new mongoose.Types.ObjectId(String(id)));

    const [movies, series] = await Promise.all([
        Movie.aggregate(cardPipeline(objectIds)),
        Series.aggregate(cardPipeline(objectIds)),
    ]);

    const byId = new Map();
    movies.forEach(doc => byId.set(String(doc._id), { ...doc, kind: 'Movies' }));
    series.forEach(doc => byId.set(String(doc._id), { ...doc, kind: 'Series' }));

    //! an id whose media has since been deleted just drops out of the list
    return ids.map(id => byId.get(String(id))).filter(Boolean);
};
