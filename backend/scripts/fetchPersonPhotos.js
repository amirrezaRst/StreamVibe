const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const sharp = require('sharp');
const { fetchPersonPhoto } = require('./lib/wikiPersonPhoto');

/**
 * Replaces the initials-monogram avatar every actor, director and composer
 * currently has with a real photo pulled from English Wikipedia — the same
 * approach fetchRealPosters.js uses for film and series art.
 *
 * Overwrites the exact filename already sitting in `profile`; the database
 * rows are untouched, only the bytes on disk change. A miss (no matching
 * article, no photo in its infobox, birth year doesn't corroborate the
 * match) leaves that person's generated avatar in place rather than risking
 * the wrong person's face — this script is safe to re-run to pick up misses.
 *
 *   node scripts/fetchPersonPhotos.js
 */

const PUBLIC = path.join(__dirname, '..', 'public');
const PHOTO_SIZE = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processOne = async ({ fullName, birthDate, role, dir, profile }) => {
    const photo = await fetchPersonPhoto({ fullName, role, birthYear: parseInt(birthDate, 10) });
    if (!photo) return false;

    const buffer = await sharp(photo).resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
    await fs.writeFile(path.join(PUBLIC, dir, profile), buffer);
    return true;
}

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Actor = require('../model/actorModel');
    const Director = require('../model/directorModel');
    const Musician = require('../model/musicianModel');

    const actors = await Actor.find().select('fullName birthDate profile');
    const directors = await Director.find().select('fullName birthDate profile');
    const musicians = await Musician.find().select('fullName birthDate profile');

    const items = [
        ...actors.map((a) => ({ ...a.toObject(), role: 'actor', dir: 'actor' })),
        ...directors.map((d) => ({ ...d.toObject(), role: 'film director', dir: 'director' })),
        //! musicians' avatars were written into public/director alongside
        //! real directors when they were seeded — same folder here
        ...musicians.map((m) => ({ ...m.toObject(), role: 'composer', dir: 'director' })),
    ];

    let hits = 0;
    const misses = [];

    for (const item of items) {
        try {
            const ok = await processOne(item);
            if (ok) { hits++; console.log(`  ok    ${item.fullName}`); }
            else { misses.push(item.fullName); console.log(`  MISS  ${item.fullName}`); }
        } catch (error) {
            misses.push(item.fullName);
            console.log(`  ERROR ${item.fullName} — ${error.message}`);
        }
        //! three API calls plus an image download per person — same spacing
        //! as the poster fetch, for the same reason
        await sleep(350);
    }

    console.log(`\n${hits}/${items.length} real photos fetched.`);
    if (misses.length) console.log('Still on generated avatars:', misses.join(', '));

    await mongoose.disconnect();
}

run().catch((error) => { console.error(error); process.exit(1); });
