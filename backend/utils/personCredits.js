const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');

/**
 * The credits and collaborators behind a person page.
 *
 * Actors, directors and composers are all attached to a title, just through
 * different fields — an array of actor ids, or a single director/musician
 * reference. So the only thing that differs between the three is the match,
 * and everything after it is shared. Written once here rather than a third
 * time in a third controller, which is how the actor and director pages drifted
 * apart in the first place.
 */

//! everything the person page renders for a credit: the card needs runtime,
//! views and rating, and the "Known for" row additionally needs the year and
//! genres to caption it
const MOVIE_FIELDS = {
    slug: 1, title: 1, thumbnail: 1, views: 1, duration: 1, rate: 1,
    genres: 1, release_date: 1, director: 1, actors: 1,
};

const SERIES_FIELDS = {
    slug: 1, title: 1, thumbnail: 1, views: 1, totalEpisodes: 1, rate: 1,
    genres: 1, release_date: 1, director: 1, actors: 1,
};

const withRating = [
    {
        $lookup: {
            from: 'reviews', localField: '_id', foreignField: 'media', as: 'reviews',
        },
    },
    { $addFields: { rate: { $avg: '$reviews.rating' } } },
];

const episodeCount = [
    {
        $lookup: {
            from: 'seasons', localField: '_id', foreignField: 'series', as: 'seasons',
        },
    },
    {
        $addFields: {
            totalEpisodes: {
                $sum: { $map: { input: '$seasons', as: 'season', in: { $size: '$$season.episodes' } } },
            },
        },
    },
];

const creditsFor = async (match, { limit = 12, skip = 0 } = {}) => {
    const paging = skip ? [{ $skip: skip }, { $limit: limit }] : [{ $limit: limit }];

    const [movies, series] = await Promise.all([
        Movie.aggregate([
            { $match: match },
            ...withRating,
            { $sort: { release_date: -1 } },
            ...paging,
            { $project: MOVIE_FIELDS },
        ]),
        Series.aggregate([
            { $match: match },
            ...withRating,
            ...episodeCount,
            { $sort: { release_date: -1 } },
            ...paging,
            { $project: SERIES_FIELDS },
        ]),
    ]);

    return { movies, series };
};

/**
 * The other people this person keeps appearing beside. For an actor that is
 * the directors who cast them; for a director or composer it's the cast they
 * work with. Ordered by how often they recur, so the top of the list is a real
 * working relationship rather than a single shared credit.
 */
const collaboratorsFrom = async (credits, { role, excludeId }) => {
    const titles = [...credits.movies, ...credits.series];

    const tally = new Map();
    titles.forEach((title) => {
        const ids = role === 'actor'
            ? [title.director].filter(Boolean)
            : (title.actors || []);

        ids.forEach((id) => {
            const key = String(id);
            if (key === String(excludeId)) return;
            tally.set(key, (tally.get(key) || 0) + 1);
        });
    });

    if (!tally.size) return [];

    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id);

    //! required lazily: this module is pulled in by the actor, director and
    //! musician controllers, and the person models pull those back in
    const Model = role === 'actor'
        ? require('../model/directorModel')
        : require('../model/actorModel');

    const people = await Model.find({ _id: { $in: ranked } }).select('fullName slug profile');

    //! find() returns them in storage order, not the order we ranked them in
    const byId = new Map(people.map((person) => [String(person._id), person]));
    return ranked.map((id) => byId.get(id)).filter(Boolean);
};

module.exports = { creditsFor, collaboratorsFrom };
