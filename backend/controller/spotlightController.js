const Spotlight = require('../model/spotlightModel');

//! everything the hero card renders — nothing the referenced movie/series
//! doesn't already have, so a slide never needs updating when the title's
//! own record changes
const MEDIA_FIELDS = 'title slug description cover thumbnail genres imdb_rating rotten_rating duration release_date';

/**
 * The live /explore carousel: active slides, in order, with each one's movie
 * or series populated. An empty result is a normal, expected response —
 * the frontend falls back to the genre rail rather than treating it as an
 * error.
 */
exports.getSpotlight = async (req, res) => {
    try {
        const slides = await Spotlight.find({ active: true })
            .sort({ order: 1 })
            .populate('media', MEDIA_FIELDS)
            .lean();

        //! a slide can outlive the title it points at (the film was deleted
        //! without the slide being cleaned up first) — populate leaves
        //! `media` null rather than throwing, so those are filtered here
        //! instead of asking the frontend to guard against a null poster
        const valid = slides.filter((slide) => slide.media);

        res.status(200).json({ status: 200, message: 'Spotlight fetched successfully', slides: valid });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
