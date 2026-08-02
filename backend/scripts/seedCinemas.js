/**
 * Seeds cinemas, halls and showtimes for local development.
 *
 *   node scripts/seedCinemas.js          add sample data (skips if cinemas exist)
 *   node scripts/seedCinemas.js --reset  wipe cinema data first, then reseed
 *
 * Showtimes are attached to movies already marked "now showing", so this only
 * does something useful once the movie collection has been seeded.
 */

const path = require('path');
const dotEnv = require('dotenv');
const mongoose = require('mongoose');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const Movie = require('../model/movieModel');
const Cinema = require('../model/cinemaModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');

const CINEMAS = [
    {
        name: 'Grand Central Cinemas',
        city: 'New York', country: 'United States',
        address: '405 Lexington Ave, Manhattan',
        location: { lat: 40.7516, lng: -73.9755 },
        amenities: ['IMAX', 'Dolby Atmos', 'Parking', 'Food Court'],
    },
    {
        name: 'Brooklyn Picture House',
        city: 'New York', country: 'United States',
        address: '188 Bedford Ave, Brooklyn',
        location: { lat: 40.7143, lng: -73.9613 },
        amenities: ['Recliner Seats', 'Bar'],
    },
    {
        name: 'Soho Screen',
        city: 'London', country: 'United Kingdom',
        address: '21 Wardour St, Soho',
        location: { lat: 51.5127, lng: -0.1310 },
        amenities: ['Dolby Atmos', 'Bar', 'Wheelchair Access'],
    },
    {
        name: 'Shibuya Cinequest',
        city: 'Tokyo', country: 'Japan',
        address: '2-24-1 Shibuya, Shibuya City',
        location: { lat: 35.6595, lng: 139.7005 },
        amenities: ['4DX', 'IMAX', 'Food Court'],
    },
    {
        name: 'Le Marais Cinémathèque',
        city: 'Paris', country: 'France',
        address: '7 Rue des Archives, Le Marais',
        location: { lat: 48.8578, lng: 2.3555 },
        amenities: ['Café', 'Wheelchair Access'],
    },
];

//! Standard rows sit at the front, premium in the middle, vip at the back —
//! the usual layout, with an aisle gap punched through the middle of each row.
const buildSeatMap = ({ rows, seatsPerRow, vipRows = [], premiumRows = [], aisleAfter = null }) =>
    rows.map(row => ({
        row,
        seats: Array.from({ length: seatsPerRow }, (_, i) => {
            const number = i + 1;
            let tier = 'standard';
            if (vipRows.includes(row)) tier = 'vip';
            else if (premiumRows.includes(row)) tier = 'premium';

            return { number, tier, disabled: aisleAfter ? number === aisleAfter : false };
        }),
    }));

const HALL_BLUEPRINTS = [
    {
        name: 'Screen 1', screenType: 'IMAX',
        seatMap: buildSeatMap({
            rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
            seatsPerRow: 14, aisleAfter: 7,
            premiumRows: ['D', 'E', 'F'], vipRows: ['G', 'H'],
        }),
    },
    {
        name: 'Screen 2', screenType: '2D',
        seatMap: buildSeatMap({
            rows: ['A', 'B', 'C', 'D', 'E', 'F'],
            seatsPerRow: 10, aisleAfter: 5,
            premiumRows: ['E', 'F'],
        }),
    },
    {
        name: 'Screen 3', screenType: '3D',
        seatMap: buildSeatMap({
            rows: ['A', 'B', 'C', 'D', 'E'],
            seatsPerRow: 12, aisleAfter: 6,
            premiumRows: ['C', 'D'], vipRows: ['E'],
        }),
    },
];

const PRICING_BY_SCREEN = {
    'IMAX': { standard: 18, premium: 24, vip: 32 },
    '3D': { standard: 15, premium: 20, vip: 27 },
    '4DX': { standard: 20, premium: 26, vip: 34 },
    '2D': { standard: 12, premium: 16, vip: 22 },
};

//! local times a cinema would realistically run screenings
const SLOT_HOURS = [11, 14, 17, 20, 22];
const LANGUAGES = ['original', 'subtitled', 'dubbed'];

const run = async () => {
    const reset = process.argv.includes('--reset');

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

    if (reset) {
        const [s, h, c] = await Promise.all([
            Showtime.deleteMany({}), Hall.deleteMany({}), Cinema.deleteMany({}),
        ]);
        console.log(`Reset: removed ${c.deletedCount} cinemas, ${h.deletedCount} halls, ${s.deletedCount} showtimes`);
    } else if (await Cinema.countDocuments() > 0) {
        console.log('Cinemas already exist — nothing to do. Re-run with --reset to rebuild.');
        return;
    }

    const cinemas = await Cinema.insertMany(CINEMAS);
    console.log(`Created ${cinemas.length} cinemas`);

    const halls = [];
    for (const cinema of cinemas) {
        //! the two flagship venues get all three screens, the rest get two
        const blueprints = ['Grand Central Cinemas', 'Shibuya Cinequest'].includes(cinema.name)
            ? HALL_BLUEPRINTS
            : HALL_BLUEPRINTS.slice(0, 2);

        for (const blueprint of blueprints) {
            halls.push(await Hall.create({ ...blueprint, cinema: cinema._id }));
        }
    }
    console.log(`Created ${halls.length} halls`);

    const movies = await Movie.find({ release_status: 'now showing' }).select('duration title').limit(8);
    if (!movies.length) {
        console.log('No movies marked "now showing" — skipping showtimes.');
        console.log('   Mark some movies as now showing, then re-run to generate screenings.');
        return;
    }

    const showtimes = [];
    let clashes = 0;

    for (const [hallIndex, hall] of halls.entries()) {
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
            for (const [slotIndex, hour] of SLOT_HOURS.entries()) {
                //! rotate films across halls and slots so each venue has a varied schedule
                const movie = movies[(hallIndex + dayOffset + slotIndex) % movies.length];

                const startsAt = new Date();
                startsAt.setDate(startsAt.getDate() + dayOffset);
                startsAt.setHours(hour, 0, 0, 0);

                if (startsAt <= new Date()) continue; // don't seed screenings in the past

                const endsAt = new Date(startsAt.getTime() + movie.duration * 60000);

                //! the seeder generates slots blindly; a long film can run past the next
                //! slot, so skip any that would overlap rather than writing bad data
                const overlaps = showtimes.some(s =>
                    String(s.hall) === String(hall._id) && s.startsAt < endsAt && s.endsAt > startsAt
                );
                if (overlaps) { clashes++; continue; }

                showtimes.push({
                    movie: movie._id,
                    hall: hall._id,
                    cinema: hall.cinema,
                    startsAt,
                    endsAt,
                    pricing: PRICING_BY_SCREEN[hall.screenType],
                    language: LANGUAGES[(hallIndex + slotIndex) % LANGUAGES.length],
                    currency: 'USD',
                });
            }
        }
    }

    await Showtime.insertMany(showtimes);
    console.log(`Created ${showtimes.length} showtimes across ${movies.length} movies${clashes ? ` (skipped ${clashes} overlapping slots)` : ''}`);
};

run()
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
