const path = require('path');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

/**
 * Reviews written before moderation existed are already public — they have been
 * on the site for as long as they have existed. Leaving them to pick up the new
 * `pending` default would empty every title's review section overnight and put
 * seventy-odd already-read reviews into a queue nobody asked for.
 *
 * Run once, after deploying the moderation change:
 *   node scripts/approveExistingReviews.js
 */
(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const reviews = mongoose.connection.db.collection('reviews');

    const stale = await reviews.countDocuments({ status: { $exists: false } });
    if (!stale) {
        console.log('Nothing to do — every review already has a status.');
        await mongoose.disconnect();
        return;
    }

    const result = await reviews.updateMany(
        { status: { $exists: false } },
        {
            $set: {
                status: 'approved',
                moderatedAt: null,
                moderatedBy: null,
                rejectionReason: null,
                spoiler: { byAuthor: false, byModerator: null, reports: [] },
            },
        }
    );

    console.log(`Approved ${result.modifiedCount} review${result.modifiedCount === 1 ? '' : 's'} that predate moderation.`);
    await mongoose.disconnect();
})().catch(error => {
    console.error(error);
    process.exit(1);
});
