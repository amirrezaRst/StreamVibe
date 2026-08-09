const Spotlight = require('../model/spotlightModel');
const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');
const { escapeRegex } = require('../utils/escapeRegex');

const MEDIA_FIELDS = 'title slug thumbnail';

/**
 * Every slide, active and hidden alike, in the order they'll play — the
 * console needs to show what's paused as well as what's live.
 */
exports.getSpotlightSlides = async (req, res) => {
    try {
        const slides = await Spotlight.find().sort({ order: 1 }).populate('media', MEDIA_FIELDS).lean();
        res.status(200).json({ status: 200, message: 'Spotlight slides fetched successfully', slides });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * The catalogue picker behind "Add to spotlight" — movies and series
 * together, each labelled with which it is, so building a slide list doesn't
 * mean checking two separate tabs.
 */
exports.searchSpotlightCandidates = async (req, res) => {
    const term = String(req.query.q || '').trim();
    if (term.length < 2) return res.status(200).json({ status: 200, message: 'Too short', candidates: [] });

    try {
        const match = new RegExp(escapeRegex(term), 'i');
        const LIMIT = 8;

        const [movies, series] = await Promise.all([
            Movie.find({ title: match }).select('title thumbnail').limit(LIMIT).lean(),
            Series.find({ title: match }).select('title thumbnail').limit(LIMIT).lean(),
        ]);

        const candidates = [
            ...movies.map((movie) => ({ ...movie, kind: 'Movies' })),
            ...series.map((show) => ({ ...show, kind: 'Series' })),
        ];

        res.status(200).json({ status: 200, message: 'Candidates fetched successfully', candidates });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Appends a title to the end of the running order. Duplicate-add attempts
 * are a normal thing to click into (the picker doesn't grey out titles
 * already on the list) rather than something to 500 on — the unique index on
 * {kind, media} is what actually enforces it; this just gives that a clean
 * response instead of a raw Mongo duplicate-key error.
 */
exports.addSpotlightSlide = async (req, res) => {
    const { kind, media } = req.body;
    if (!['Movies', 'Series'].includes(kind) || !media) {
        return res.status(400).json({ status: 400, message: 'kind and media are required' });
    }

    try {
        const Model = kind === 'Movies' ? Movie : Series;
        const exists = await Model.exists({ _id: media });
        if (!exists) return res.status(404).json({ status: 404, message: `${kind === 'Movies' ? 'Movie' : 'Series'} not found` });

        const last = await Spotlight.findOne().sort({ order: -1 }).select('order').lean();
        const slide = await Spotlight.create({ kind, media, order: (last?.order ?? -1) + 1 });
        const populated = await slide.populate('media', MEDIA_FIELDS);

        res.status(201).json({ status: 201, message: 'Added to spotlight', slide: populated });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ status: 409, message: 'Already in the spotlight' });
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Persists a drag-reorder in one round trip — the console sends the full
 * ordered id list it now shows, and each slide's `order` becomes its index
 * in that list. Bulk rather than one request per row: dropping a title at
 * the top of an eight-slide list would otherwise fire eight requests for one
 * drag.
 */
exports.reorderSpotlightSlides = async (req, res) => {
    const { order } = req.body;
    if (!Array.isArray(order) || !order.length) {
        return res.status(400).json({ status: 400, message: 'order must be a non-empty array of slide ids' });
    }

    try {
        await Spotlight.bulkWrite(
            order.map((id, index) => ({
                updateOne: { filter: { _id: id }, update: { order: index } },
            })),
        );
        res.status(200).json({ status: 200, message: 'Order saved' });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! pulling a title for a while without losing its place in the order
exports.toggleSpotlightSlide = async (req, res) => {
    try {
        const slide = await Spotlight.findByIdAndUpdate(
            req.params.id,
            { active: Boolean(req.body.active) },
            { new: true },
        ).populate('media', MEDIA_FIELDS);

        if (!slide) return res.status(404).json({ status: 404, message: 'Slide not found' });
        res.status(200).json({ status: 200, message: 'Slide updated', slide });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.removeSpotlightSlide = async (req, res) => {
    try {
        const slide = await Spotlight.findByIdAndDelete(req.params.id);
        if (!slide) return res.status(404).json({ status: 404, message: 'Slide not found' });
        res.status(200).json({ status: 200, message: 'Removed from spotlight' });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
