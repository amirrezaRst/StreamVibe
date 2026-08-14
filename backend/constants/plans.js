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

//! how long each billing cycle buys, in days
const BILLING_CYCLES = {
    month: { label: 'Monthly', days: 31 },
    year: { label: 'Yearly', days: 365 },
};

/**
 * Price lives here and nowhere else.
 *
 * It used to exist only in the frontend's PlansVariant.js, with the browser
 * telling the server which plan to switch on — so the amount charged was
 * whatever the client said it was. Now the client only names a plan and a
 * cycle; what that costs is decided here, server-side, and the checkout
 * session is built from these numbers.
 */
const PLANS = {
    basic: {
        label: 'Basic',
        maxQuality: '720p',
        canDownload: false,
        price: { month: 9.99, year: 95.99 },
    },
    standard: {
        label: 'Standard',
        maxQuality: '1080p',
        canDownload: true,
        price: { month: 12.99, year: 124.99 },
    },
    premium: {
        label: 'Premium',
        maxQuality: '4K',
        canDownload: true,
        price: { month: 14.99, year: 143.99 },
    },
};

const CURRENCY = 'usd';

const priceFor = (plan, cycle) => {
    const entry = PLANS[plan];
    if (!entry || !BILLING_CYCLES[cycle]) return null;
    return entry.price[cycle];
};

//! someone with no active subscription streams nothing — trailers are served
//! from their own field and never go through the quality ladder at all
const NO_ACCESS = { label: 'Free', maxQuality: null, canDownload: false };

//! what a plan lets you do, without what it costs — an entitlement answers
//! "may I play this at 4K", and the price is nobody's business at that point
const planCapabilities = (plan) => {
    const entry = PLANS[plan];
    if (!entry) return NO_ACCESS;

    return { label: entry.label, maxQuality: entry.maxQuality, canDownload: entry.canDownload };
};

const qualitiesUpTo = (maxQuality) => {
    if (!maxQuality) return [];
    const ceiling = QUALITY_LADDER.indexOf(maxQuality);
    return ceiling === -1 ? [] : QUALITY_LADDER.slice(0, ceiling + 1);
};

module.exports = {
    PLANS, NO_ACCESS, QUALITY_LADDER, BILLING_CYCLES, CURRENCY,
    planCapabilities, qualitiesUpTo, priceFor,
};
