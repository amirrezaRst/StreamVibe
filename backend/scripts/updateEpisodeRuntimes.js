/**
 * Replaces the flat, show-wide runtime importSeason1Episodes.js originally
 * gave every episode (an average taken from the main article's infobox
 * range, e.g. "43–58 minutes" → 51 for every Breaking Bad episode alike)
 * with each episode's real, individual runtime where Wikipedia actually
 * states one — read from the dedicated article a wikilinked episode title
 * points to, same as {{Infobox television episode}}'s own `length` field.
 *
 * Only `runtime` is touched. Title, description, air date and pictures were
 * already correct from the original import and are left alone.
 */
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');

const Series = require('../model/seriesModel');
const Episode = require('../model/episodeModel');
const { fetchSeasonOne } = require('./lib/wikiEpisodes');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const seriesList = await Series.find().select('title');
    const report = { updated: 0, unchanged: 0, failed: [] };

    for (const series of seriesList) {
        try {
            const result = await fetchSeasonOne(series.title);
            if (!result) {
                report.failed.push(series.title);
                console.log(`✗ ${series.title} — no Wikipedia data found`);
                await sleep(350);
                continue;
            }

            let changed = 0;
            for (const ep of result.episodes) {
                const res = await Episode.updateOne(
                    { series: series._id, seasonNumber: 1, episodeNumber: ep.number },
                    { runtime: ep.runtime },
                );
                if (res.modifiedCount) changed++;
            }

            report.updated += changed;
            report.unchanged += result.episodes.length - changed;
            console.log(`✓ ${series.title} — ${changed}/${result.episodes.length} runtimes changed`);
        } catch (err) {
            report.failed.push(series.title);
            console.log(`✗ ${series.title} — ${err.message}`);
        }

        await sleep(350);
    }

    console.log('\n=== SUMMARY ===');
    console.log(`${report.updated} episodes updated, ${report.unchanged} already matched, ${report.failed.length} series failed`);
    if (report.failed.length) console.log('Failed:', report.failed.join(', '));

    process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
