const path = require('path');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const { uniqueSlug } = require('../utils/slug');

/**
 * Gives every existing film, series, actor and director the slug its public
 * URL will use from now on. Records that already have one are skipped, so
 * this is safe to re-run and safe to run against a database that has been
 * partially migrated.
 *
 * Ordered oldest-first so that when two records would produce the same slug,
 * the one that has existed longer keeps the bare form and the newer one takes
 * the disambiguated variant — the older record is the more likely to already
 * be linked somewhere.
 *
 *   node scripts/backfillSlugs.js
 */

const COLLECTIONS = [
    { model: '../model/movieModel', label: 'movies', field: 'title', year: 'release_date' },
    { model: '../model/seriesModel', label: 'series', field: 'title', year: 'release_date' },
    { model: '../model/actorModel', label: 'actors', field: 'fullName' },
    { model: '../model/directorModel', label: 'directors', field: 'fullName' },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    for (const { model, label, field, year } of COLLECTIONS) {
        const Model = require(model);
        const pending = await Model.find({ $or: [{ slug: { $exists: false } }, { slug: null }] }).sort({ _id: 1 });

        let done = 0;
        for (const record of pending) {
            record.slug = await uniqueSlug(Model, record[field], {
                year: year ? record[year] : undefined,
                excludeId: record._id,
            });
            await record.save();
            done += 1;
        }

        const total = await Model.countDocuments();
        console.log(`  ${label.padEnd(10)} ${String(done).padStart(4)} slugged  (${total} total)`);
    }

    await mongoose.disconnect();
};

run().catch((error) => { console.error(error); process.exit(1); });
