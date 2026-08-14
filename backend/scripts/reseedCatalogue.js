const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const { posterSVG, avatarSVG, rasterize } = require('./lib/artGenerator');
const { MOVIES, SERIES } = require('./catalogueData');
const { DIRECTORS, ACTORS } = require('./peopleData');

/**
 * Replaces the demo catalogue's placeholder titles ("movie 8", zeroed
 * ratings, country/language hardcoded to Iran/Persian on every record) with
 * real, accurate film and TV data, and gives every title, actor and director
 * generated poster/avatar art instead of the broken test-upload filenames
 * that were there before.
 *
 * On a database that already has one movie/series per catalogueData.js entry,
 * existing documents are updated in place — never deleted and recreated —
 * because showtimes, bookings, reviews and watchlists already reference
 * these _ids. The mapping from "which curated record goes on which document"
 * is purely positional: documents sorted by _id, zipped against
 * catalogueData.js in the same order. That order is fixed once by this
 * script; re-running it against such a database is safe and produces the
 * same result (art is seeded deterministically from the title/name, so file
 * bytes don't churn) — though note it always overwrites thumbnail/cover/
 * trailer/files back to generated placeholders, so it should not be re-run
 * once fetchRealPosters.js or real uploads have replaced them.
 *
 * On a genuinely empty database (a fresh clone, nothing seeded yet) there is
 * nothing to zip positionally against, so one new document per catalogueData
 * entry is created instead — this is what makes the script usable from
 * scratch rather than only as a follow-up to some other, undocumented,
 * initial fixture load.
 *
 *   node scripts/reseedCatalogue.js
 */

const PUBLIC = path.join(__dirname, '..', 'public');

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const writeArt = async (dir, filename, svg) => {
    const buffer = await rasterize(svg);
    await fs.writeFile(path.join(PUBLIC, dir, filename), buffer);
    return filename;
};

//! upserts by name so the same real person linked from several titles (three
//! Christopher Nolan films, five Leonardo DiCaprio roles) becomes one document,
//! not one per appearance
const personCache = { director: new Map(), actor: new Map() };

const resolveDirector = async (Director, name) => {
    if (personCache.director.has(name)) return personCache.director.get(name);

    const facts = DIRECTORS[name];
    if (!facts) throw new Error(`No biographical facts for director "${name}" — add one to peopleData.js`);

    const filename = `${slug(name)}.jpg`;
    await writeArt('director', filename, avatarSVG({ fullName: name }));

    const credits = [...MOVIES, ...SERIES].filter((m) => m.director === name).map((m) => m.title);

    const doc = await Director.findOneAndUpdate(
        { fullName: name },
        {
            fullName: name,
            birthDate: String(facts.y),
            birthPlace: facts.p,
            gender: facts.g,
            country: facts.c,
            bio: `Director known for ${credits.join(', ')}.`,
            profile: filename,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    personCache.director.set(name, doc);
    return doc;
};

const resolveActor = async (Actor, name) => {
    if (personCache.actor.has(name)) return personCache.actor.get(name);

    const facts = ACTORS[name];
    if (!facts) throw new Error(`No biographical facts for actor "${name}" — add one to peopleData.js`);

    const filename = `${slug(name)}.jpg`;
    await writeArt('actor', filename, avatarSVG({ fullName: name }));

    const credits = [...MOVIES, ...SERIES].filter((m) => m.actors.includes(name)).map((m) => m.title);

    const doc = await Actor.findOneAndUpdate(
        { fullName: name },
        {
            fullName: name,
            birthDate: String(facts.y),
            birthPlace: facts.p,
            gender: facts.g,
            country: facts.c,
            bio: `Actor known for ${credits.join(', ')}.`,
            profile: filename,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    personCache.actor.set(name, doc);
    return doc;
};

//! shared by movies and series — the two schemas diverge only in `duration`
//! (movies only) and `seasons` (series only, and deliberately left untouched
//! below so existing Season/Episode relationships survive)
const applyRecord = async ({ Actor, Director, doc, record }) => {
    const directorDoc = await resolveDirector(Director, record.director);
    const actorDocs = await Promise.all(record.actors.map((name) => resolveActor(Actor, name)));

    const thumbnailFile = `${slug(record.title)}.jpg`;
    const coverFile = `${slug(record.title)}-cover.jpg`;
    await writeArt('thumbnail', thumbnailFile, posterSVG({ title: record.title, genreKeys: record.genres, variant: 'thumbnail' }));
    await writeArt('cover', coverFile, posterSVG({ title: record.title, genreKeys: record.genres, variant: 'cover' }));

    doc.set({
        title: record.title,
        description: record.description,
        genres: record.genres,
        category: record.genres,
        country: record.country,
        language: record.language,
        age_rating: record.age_rating,
        imdb_rating: record.imdb,
        rotten_rating: record.rt,
        release_date: record.year,
        release_status: 'now showing',
        director: directorDoc._id,
        actors: actorDocs.map((a) => a._id),
        thumbnail: thumbnailFile,
        cover: coverFile,
        trailer: coverFile,
        files: [],
    });
    if (record.duration) doc.set('duration', record.duration);

    await doc.save();
};

(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const Movie = require('../model/movieModel');
    const Series = require('../model/seriesModel');
    const Actor = require('../model/actorModel');
    const Director = require('../model/directorModel');

    for (const dir of ['thumbnail', 'cover', 'actor', 'director']) {
        await fs.mkdir(path.join(PUBLIC, dir), { recursive: true });
    }

    let movies = await Movie.find().sort({ _id: 1 });
    let series = await Series.find().sort({ _id: 1 });

    if (movies.length === 0) {
        movies = MOVIES.map(() => new Movie());
    } else if (movies.length !== MOVIES.length) {
        throw new Error(`Expected ${MOVIES.length} movies in the database (or 0, for a fresh seed), found ${movies.length} — the positional mapping would be wrong. Aborting without writing anything.`);
    }
    if (series.length === 0) {
        series = SERIES.map(() => new Series());
    } else if (series.length !== SERIES.length) {
        throw new Error(`Expected ${SERIES.length} series in the database (or 0, for a fresh seed), found ${series.length} — the positional mapping would be wrong. Aborting without writing anything.`);
    }

    console.log(`Reseeding ${movies.length} movies...`);
    for (let i = 0; i < movies.length; i++) {
        await applyRecord({ Actor, Director, doc: movies[i], record: MOVIES[i] });
        process.stdout.write(`  ${i + 1}/${movies.length}\r`);
    }

    console.log(`\nReseeding ${series.length} series...`);
    for (let i = 0; i < series.length; i++) {
        await applyRecord({ Actor, Director, doc: series[i], record: SERIES[i] });
        process.stdout.write(`  ${i + 1}/${series.length}\r`);
    }

    console.log(`\nDone. ${personCache.director.size} directors, ${personCache.actor.size} actors.`);
    await mongoose.disconnect();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
