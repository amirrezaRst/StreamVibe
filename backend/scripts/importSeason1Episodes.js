/**
 * Replaces every series' season/episode data with a real Season 1 pulled
 * from Wikipedia — before this, 32 of 34 series had none at all, and the
 * two that did (Halo, Vikings: Valhalla) had leftover test fixtures: every
 * episode literally titled "The Vanishing of Will Byers Episode X Season Y"
 * (a Stranger Things episode name, copy-pasted onto an unrelated show),
 * blank descriptions, and download links pointing at random test-upload
 * filenames rather than anything real.
 *
 * Per-episode stills aren't reliably available freely licensed on
 * Wikipedia, so every episode of a show reuses that show's own thumbnail —
 * the same image already sits in the episode player as the poster before
 * playback starts. `files` is left empty, matching real movies in this
 * catalogue (`Movie.files: []`) rather than inventing fake download links.
 */
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');

const Series = require('../model/seriesModel');
const Season = require('../model/seasonModel');
const Episode = require('../model/episodeModel');
const { fetchSeasonOne } = require('./lib/wikiEpisodes');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const seriesList = await Series.find().select('title thumbnail seasons');
    const report = { ok: [], failed: [] };

    for (const series of seriesList) {
        try {
            const result = await fetchSeasonOne(series.title);
            if (!result) {
                report.failed.push({ title: series.title, reason: 'no Wikipedia episode data found' });
                await sleep(350);
                continue;
            }

            //! clear whatever seasons/episodes this series already had —
            //! confirmed above to be either empty or mock fixtures, never
            //! real data worth preserving
            const oldSeasons = await Season.find({ series: series._id }).select('episodes');
            const oldEpisodeIds = oldSeasons.flatMap((s) => s.episodes);
            if (oldEpisodeIds.length) await Episode.deleteMany({ _id: { $in: oldEpisodeIds } });
            if (oldSeasons.length) await Season.deleteMany({ series: series._id });

            const episodeDocs = await Episode.insertMany(result.episodes.map((ep) => ({
                title: ep.title,
                description: ep.description,
                releaseDate: (ep.airDate || new Date()).toString(),
                runtime: result.runtime,
                episodeNumber: ep.number,
                seasonNumber: 1,
                series: series._id,
                pictures: [series.thumbnail],
                files: [],
            })));

            const season = await Season.create({
                series: series._id,
                seasonNumber: 1,
                episodes: episodeDocs.map((e) => e._id),
            });

            series.seasons = [season._id];
            await series.save();

            report.ok.push({ title: series.title, source: result.source, episodes: episodeDocs.length });
            console.log(`✓ ${series.title} — ${episodeDocs.length} episodes (${result.source})`);
        } catch (err) {
            report.failed.push({ title: series.title, reason: err.message });
            console.log(`✗ ${series.title} — ${err.message}`);
        }

        //! polite pacing between shows — each show is itself several
        //! Wikipedia API calls (search, sections, wikitext x1-2)
        await sleep(350);
    }

    console.log('\n=== SUMMARY ===');
    console.log(`${report.ok.length} succeeded, ${report.failed.length} failed`);
    if (report.failed.length) {
        console.log('\nFailed:');
        report.failed.forEach((f) => console.log(`  - ${f.title}: ${f.reason}`));
    }

    require('fs').writeFileSync('season1_import_report.json', JSON.stringify(report, null, 2));
    process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
