const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const { avatarSVG, rasterize } = require('./lib/artGenerator');

/**
 * Gives the catalogue real composers, replacing the hardcoded "Kyle Dixon"
 * the film and series sidebars printed on every single title regardless of
 * what it was.
 *
 * Only titles listed here get a composer; everything else keeps none, and the
 * sidebar hides the block rather than inventing a credit. Safe to re-run —
 * people are upserted by name and a title already carrying a composer is left
 * alone.
 *
 *   node scripts/seedMusicians.js
 */

const PUBLIC = path.join(__dirname, '..', 'public');

//! g: gender — y: birth year — c: country — p: birthplace
const COMPOSERS = {
    'Hans Zimmer': { g: 'male', y: 1957, c: 'Germany', p: 'Frankfurt, Germany' },
    'Ludwig Göransson': { g: 'male', y: 1984, c: 'Sweden', p: 'Linköping, Sweden' },
    'Ramin Djawadi': { g: 'male', y: 1974, c: 'Germany', p: 'Duisburg, Germany' },
    'Hildur Guðnadóttir': { g: 'female', y: 1982, c: 'Iceland', p: 'Reykjavík, Iceland' },
    'Howard Shore': { g: 'male', y: 1946, c: 'Canada', p: 'Toronto, Ontario' },
    'John Williams': { g: 'male', y: 1932, c: 'United States', p: 'Queens, New York' },
    'Ennio Morricone': { g: 'male', y: 1928, c: 'Italy', p: 'Rome, Italy' },
    'Justin Hurwitz': { g: 'male', y: 1985, c: 'United States', p: 'Los Angeles, California' },
    'Jung Jae-il': { g: 'male', y: 1982, c: 'South Korea', p: 'Seoul, South Korea' },
    'Alexandre Desplat': { g: 'male', y: 1961, c: 'France', p: 'Paris, France' },
    'Michael Giacchino': { g: 'male', y: 1967, c: 'United States', p: 'Riverside, New Jersey' },
    'Joe Hisaishi': { g: 'male', y: 1950, c: 'Japan', p: 'Nakano, Japan' },
    'Trent Reznor': { g: 'male', y: 1965, c: 'United States', p: 'New Castle, Pennsylvania' },
    'Junkie XL': { g: 'male', y: 1967, c: 'Netherlands', p: 'Lichtenvoorde, Netherlands' },
    'Dave Porter': { g: 'male', y: 1970, c: 'United States', p: 'New York' },
    'Kyle Dixon': { g: 'male', y: 1985, c: 'United States', p: 'Austin, Texas' },
    'Nicholas Britell': { g: 'male', y: 1980, c: 'United States', p: 'New York City, New York' },
    'Bear McCreary': { g: 'male', y: 1979, c: 'United States', p: 'Fort Lauderdale, Florida' },
    'Cristobal Tapia de Veer': { g: 'male', y: 1974, c: 'Chile', p: 'Chile' },
    'Theodore Shapiro': { g: 'male', y: 1971, c: 'United States', p: 'Washington, D.C.' },
};

//! title -> composer, for the titles where the credit is well known
const MOVIE_SCORES = {
    'Inception': 'Hans Zimmer',
    'Interstellar': 'Hans Zimmer',
    'The Dark Knight': 'Hans Zimmer',
    'Dune': 'Hans Zimmer',
    'Gladiator': 'Hans Zimmer',
    'Oppenheimer': 'Ludwig Göransson',
    'Joker': 'Hildur Guðnadóttir',
    'The Lord of the Rings: The Rings of Power': 'Howard Shore',
    'Jurassic Park': 'John Williams',
    'Titanic': 'James Horner',
    'Django Unchained': 'Ennio Morricone',
    'Whiplash': 'Justin Hurwitz',
    'La La Land': 'Justin Hurwitz',
    'Parasite': 'Jung Jae-il',
    'The Grand Budapest Hotel': 'Alexandre Desplat',
    'The Batman': 'Michael Giacchino',
    'Up': 'Michael Giacchino',
    'Spirited Away': 'Joe Hisaishi',
    'The Social Network': 'Trent Reznor',
    'Mad Max: Fury Road': 'Junkie XL',
    'Coco': 'Michael Giacchino',
    'Get Out': 'Michael Abels',
    '1917': 'Thomas Newman',
};

const SERIES_SCORES = {
    'Game of Thrones': 'Ramin Djawadi',
    'House of the Dragon': 'Ramin Djawadi',
    'Westworld': 'Ramin Djawadi',
    'Chernobyl': 'Hildur Guðnadóttir',
    'Breaking Bad': 'Dave Porter',
    'Better Call Saul': 'Dave Porter',
    'Stranger Things': 'Kyle Dixon',
    'Succession': 'Nicholas Britell',
    'The Last of Us': 'Gustavo Santaolalla',
    'Severance': 'Theodore Shapiro',
    'The Boys': 'Christopher Lennertz',
    'Peaky Blinders': 'Anthony Genn',
};

//! composers named above that need biographical facts before they can be saved
const EXTRA = {
    'James Horner': { g: 'male', y: 1953, c: 'United States', p: 'Los Angeles, California' },
    'Michael Abels': { g: 'male', y: 1962, c: 'United States', p: 'Phoenix, Arizona' },
    'Thomas Newman': { g: 'male', y: 1955, c: 'United States', p: 'Los Angeles, California' },
    'Gustavo Santaolalla': { g: 'male', y: 1951, c: 'Argentina', p: 'El Palomar, Argentina' },
    'Christopher Lennertz': { g: 'male', y: 1972, c: 'United States', p: 'New Jersey' },
    'Anthony Genn': { g: 'male', y: 1970, c: 'United Kingdom', p: 'Sheffield, England' },
};

const FACTS = { ...COMPOSERS, ...EXTRA };

const slugFile = (name) => `${name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.jpg`;

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const Musician = require('../model/musicianModel');
    const Movie = require('../model/movieModel');
    const Series = require('../model/seriesModel');

    //! which composers are actually referenced by a title — no point creating
    //! records for people nothing credits
    const credited = new Set([...Object.values(MOVIE_SCORES), ...Object.values(SERIES_SCORES)]);

    const byName = new Map();
    for (const name of credited) {
        const facts = FACTS[name];
        if (!facts) {
            console.log(`  skip   ${name} — no biographical facts on file`);
            continue;
        }

        let musician = await Musician.findOne({ fullName: name });
        if (!musician) {
            const file = slugFile(name);
            await fs.writeFile(
                path.join(PUBLIC, 'director', file),
                await rasterize(avatarSVG({ fullName: name })),
            );

            musician = await Musician.create({
                fullName: name,
                gender: facts.g,
                birthDate: String(facts.y),
                birthPlace: facts.p,
                country: facts.c,
                profile: file,
                bio: `Composer known for scoring ${
                    [...Object.entries({ ...MOVIE_SCORES, ...SERIES_SCORES })]
                        .filter(([, who]) => who === name).map(([title]) => title).slice(0, 4).join(', ')
                }.`,
            });
        }
        byName.set(name, musician);
    }

    let attached = 0;
    for (const [Model, scores] of [[Movie, MOVIE_SCORES], [Series, SERIES_SCORES]]) {
        for (const [title, composer] of Object.entries(scores)) {
            const musician = byName.get(composer);
            if (!musician) continue;

            const result = await Model.updateOne({ title, musician: { $exists: false } }, { musician: musician._id });
            attached += result.modifiedCount;
        }
    }

    console.log(`\n  ${byName.size} composers on record, ${attached} titles credited.`);

    const withoutComposer = await Movie.countDocuments({ musician: { $exists: false } })
        + await Series.countDocuments({ musician: { $exists: false } });
    console.log(`  ${withoutComposer} titles have no composer — their sidebar hides the block.`);

    await mongoose.disconnect();
};

run().catch((error) => { console.error(error); process.exit(1); });
