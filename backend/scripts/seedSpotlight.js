const path = require('path');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

/**
 * Populates the /explore hero carousel with a handful of real titles so
 * there is something to look at before an admin has curated it by hand.
 * Safe to re-run — existing slides are left alone by the unique
 * {kind, media} index.
 *
 *   node scripts/seedSpotlight.js
 */

const PICKS = [
    { title: 'Inception', kind: 'Movies' },
    { title: 'The Dark Knight', kind: 'Movies' },
    { title: 'Dune', kind: 'Movies' },
    { title: 'Stranger Things', kind: 'Series' },
    { title: 'Oppenheimer', kind: 'Movies' },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Movie = require('../model/movieModel');
    const Series = require('../model/seriesModel');
    const Spotlight = require('../model/spotlightModel');

    let order = 0;
    for (const { title, kind } of PICKS) {
        const Model = kind === 'Movies' ? Movie : Series;
        const record = await Model.findOne({ title }).select('_id');
        if (!record) { console.log(`  skip   ${title} — not in the catalogue`); continue; }

        const result = await Spotlight.updateOne(
            { kind, media: record._id },
            { $setOnInsert: { order: order++ } },
            { upsert: true },
        );
        console.log(`  ${result.upsertedCount ? 'added ' : 'exists'} ${title}`);
    }

    await mongoose.disconnect();
};

run().catch((error) => { console.error(error); process.exit(1); });
