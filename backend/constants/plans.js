/**
 * What each subscription tier actually unlocks.
 *
 * The three plans used to be cosmetic — identical access, with marketing copy
 * that promised differences ("wider selection", "Offline Viewing") the code
 * never enforced. These are the real capabilities now, and they are checked
 * server-side rather than by hiding a button.
 *
 * `maxQuality` leans on the quality enum the episode/movie `files` schema
 * already declares, so the ceiling is expressed in the vocabulary the data is
 * already stored in rather than a parallel scale invented for billing.
 */

//! ascending, so a tier's ceiling is "this index and everything below it"
const QUALITY_LADDER = ['360p', '480p', '720p', '1080p', '4K'];

const PLANS = {
    basic: {
        label: 'Basic',
        maxQuality: '720p',
        canDownload: false,
    },
    standard: {
        label: 'Standard',
        maxQuality: '1080p',
        canDownload: true,
    },
    premium: {
        label: 'Premium',
        maxQuality: '4K',
        canDownload: true,
    },
};

//! someone with no active subscription streams nothing — trailers are served
//! from their own field and never go through the quality ladder at all
const NO_ACCESS = { label: 'Free', maxQuality: null, canDownload: false };

const planCapabilities = (plan) => PLANS[plan] || NO_ACCESS;

const qualitiesUpTo = (maxQuality) => {
    if (!maxQuality) return [];
    const ceiling = QUALITY_LADDER.indexOf(maxQuality);
    return ceiling === -1 ? [] : QUALITY_LADDER.slice(0, ceiling + 1);
};

module.exports = { PLANS, NO_ACCESS, QUALITY_LADDER, planCapabilities, qualitiesUpTo };
