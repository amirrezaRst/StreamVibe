const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Runs every seed/enrichment script in the one order they actually depend on
 * — reseedCatalogue before anything that reads its movies/series/people,
 * importSeason1Episodes before updateEpisodeRuntimes — so a fresh clone goes
 * from an empty database to a fully populated catalogue with one command
 * instead of someone reverse-engineering the require() chain across 10
 * disconnected files.
 *
 * Each step already connects/disconnects its own Mongoose connection, and a
 * failed run doesn't need to resume from where it stopped — fix the issue
 * and run this again from the top; on an empty database that's exactly
 * equivalent to a first run. Once the catalogue is populated, though, only
 * re-run this against an already-seeded database if you actually want to
 * reset generated art and video files back to placeholders: reseedCatalogue
 * always overwrites thumbnail/cover/trailer/files, even ones fetchRealPosters
 * or a real admin upload has since replaced with something real.
 *
 * The last four steps call out to Wikipedia for real posters, real person
 * photos and real Season 1 episode data. They already degrade gracefully
 * per-title (a miss just leaves the generated placeholder in place, logged,
 * not thrown), but on a machine with no network access at all skip them:
 *
 *   node scripts/seed.js                run everything
 *   node scripts/seed.js --skip-network skip the Wikipedia-dependent steps
 *                                        (leaves generated placeholder art,
 *                                        and series with no episodes)
 */

const SCRIPTS_DIR = __dirname;
const BACKEND_ROOT = path.join(__dirname, '..');

const STEPS = [
    { file: 'reseedCatalogue.js', network: false, note: 'real titles, ratings, generated poster/avatar art' },
    { file: 'backfillSlugs.js', network: false, note: 'slugs for movies/series/actors/directors' },
    { file: 'seedMusicians.js', network: false, note: 'real composer credits' },
    { file: 'naturalizeComposerBios.js', network: false, note: 'hand-written composer bios' },
    { file: 'seedCinemas.js', network: false, note: 'cinemas, halls, showtimes' },
    { file: 'seedSpotlight.js', network: false, note: 'explore-page hero carousel' },
    { file: 'importSeason1Episodes.js', network: true, note: 'real Season 1 episodes from Wikipedia' },
    { file: 'updateEpisodeRuntimes.js', network: true, note: 'per-episode runtimes from Wikipedia' },
    { file: 'fetchRealPosters.js', network: true, note: 'real posters from Wikipedia' },
    { file: 'fetchPersonPhotos.js', network: true, note: 'real cast/crew photos from Wikipedia' },
];

const skipNetwork = process.argv.includes('--skip-network');
const steps = STEPS.filter((step) => !skipNetwork || !step.network);

console.log(`Running ${steps.length} seed step(s)${skipNetwork ? ' (network steps skipped)' : ''}\n`);

for (const [index, step] of steps.entries()) {
    console.log(`[${index + 1}/${steps.length}] ${step.file} — ${step.note}`);
    try {
        execFileSync(process.execPath, [path.join(SCRIPTS_DIR, step.file)], {
            cwd: BACKEND_ROOT,
            stdio: 'inherit',
        });
    } catch {
        console.error(`\n✗ ${step.file} failed — stopping here. Every step above already finished and is`
            + ` safe to re-run, so fix the issue and run "node scripts/seed.js" again from the top.`);
        process.exit(1);
    }
    console.log('');
}

console.log('Seed complete.');
