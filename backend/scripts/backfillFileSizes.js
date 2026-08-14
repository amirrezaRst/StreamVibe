const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

/**
 * Fills in `size` on every existing movie/episode video file that predates
 * the field — new uploads capture it straight from multer, but a file that
 * was already on disk before this existed has nothing to read it from except
 * the disk itself.
 *
 * Safe to re-run: only files missing `size` are touched, and a file that has
 * gone missing from disk is reported and skipped rather than guessed at.
 *
 *   node scripts/backfillFileSizes.js
 */

const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');

const COLLECTIONS = [
    { model: '../model/movieModel', label: 'movies' },
    { model: '../model/episodeModel', label: 'episodes' },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    let filled = 0;
    let missing = 0;

    for (const { model, label } of COLLECTIONS) {
        const Model = require(model);
        //! only documents carrying at least one file with no size — cheaper
        //! than loading every document with a non-empty files array
        const pending = await Model.find({ 'files.size': { $exists: false }, 'files.0': { $exists: true } });

        for (const record of pending) {
            let touched = false;

            for (const file of record.files) {
                if (file.size != null) continue;

                const filePath = path.join(VIDEOS_DIR, file.url);
                if (!fs.existsSync(filePath)) {
                    console.log(`  [${label}] ${record.title}: ${file.url} not found on disk, skipped`);
                    missing++;
                    continue;
                }

                file.size = fs.statSync(filePath).size;
                touched = true;
                filled++;
            }

            if (touched) await record.save();
        }

        console.log(`${label}: ${pending.length} record(s) checked`);
    }

    console.log(`\n${filled} file(s) backfilled, ${missing} missing from disk`);
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
