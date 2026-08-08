const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const sharp = require('sharp');
const { fetchWikipediaPoster } = require('./lib/wikiPoster');

/**
 * Replaces the generated placeholder art with each title's real theatrical
 * poster, pulled from English Wikipedia. Overwrites the exact filenames
 * already sitting in `thumbnail`/`cover` — the database rows from the
 * catalogue reseed are untouched, only the bytes on disk change.
 *
 * Wikipedia's poster files are non-free, fair-use images (see
 * lib/wikiPoster.js) — the site owner made an informed call to accept that
 * for a portfolio deployment. A miss (no article found, no infobox image,
 * network hiccup) just leaves that title's generated art in place rather
 * than failing the run; this script is safe to re-run to pick up misses.
 *
 * Run once against the target database:
 *   node scripts/fetchRealPosters.js
 */

const PUBLIC = path.join(__dirname, '..', 'public');
const THUMB_SIZE = [576, 864];
const COVER_SIZE = [1600, 900];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//! a straight cover-fit crop for the thumbnail (posters are already ~2:3,
//! so this barely crops); the cover banner blurs a stretched copy as an
//! ambient backdrop and composites the crisp poster centered on top — the
//! same trick Spotify/Apple Music use for art with no dedicated wide asset,
//! and it hides the upscale softness that a bare stretch to 1600px would show
const buildThumbnail = (poster) =>
    sharp(poster).resize(...THUMB_SIZE, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();

const buildCover = async (poster) => {
    const backdrop = await sharp(poster).resize(...COVER_SIZE, { fit: 'cover' }).blur(45).modulate({ brightness: 0.55 }).toBuffer();
    const insert = await sharp(poster).resize(340, null, { fit: 'inside' }).toBuffer();
    const { width, height } = await sharp(insert).metadata();

    return sharp(backdrop)
        .composite([{ input: insert, left: Math.round((COVER_SIZE[0] - width) / 2), top: Math.round((COVER_SIZE[1] - height) / 2) }])
        .jpeg({ quality: 88 })
        .toBuffer();
}

const processOne = async ({ title, release_date, kind, thumbnail, cover }) => {
    const poster = await fetchWikipediaPoster({ title, year: release_date, kind });
    if (!poster) return false;

    const [thumbBuffer, coverBuffer] = await Promise.all([buildThumbnail(poster), buildCover(poster)]);
    await fs.writeFile(path.join(PUBLIC, 'thumbnail', thumbnail), thumbBuffer);
    await fs.writeFile(path.join(PUBLIC, 'cover', cover), coverBuffer);
    return true;
}

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
    const Movie = require('../model/movieModel');
    const Series = require('../model/seriesModel');

    const movies = await Movie.find().select('title release_date thumbnail cover');
    const series = await Series.find().select('title release_date thumbnail cover');

    const items = [
        ...movies.map((m) => ({ ...m.toObject(), kind: 'movie' })),
        ...series.map((s) => ({ ...s.toObject(), kind: 'series' })),
    ];

    let hits = 0;
    const misses = [];

    for (const item of items) {
        try {
            const ok = await processOne(item);
            if (ok) { hits++; console.log(`  ok    ${item.title}`); }
            else { misses.push(item.title); console.log(`  MISS  ${item.title}`); }
        } catch (error) {
            misses.push(item.title);
            console.log(`  ERROR ${item.title} — ${error.message}`);
        }
        //! polite spacing between titles — three API calls plus an image
        //! download per title is already four requests; no reason to hammer
        await sleep(350);
    }

    console.log(`\n${hits}/${items.length} real posters fetched.`);
    if (misses.length) console.log('Still on generated art:', misses.join(', '));

    await mongoose.disconnect();
}

run().catch((error) => { console.error(error); process.exit(1); });
