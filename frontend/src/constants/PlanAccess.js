/**
 * Client-side mirror of backend/constants/plans.js.
 *
 * This decides what the UI *offers*; the server decides what it *allows*
 * (RequireSubscription + downloadGuard). Keeping both is deliberate — showing
 * a viewer a button that will 403 is a worse experience than hiding it, but
 * hiding it is not what makes the file safe.
 */
export const QUALITY_LADDER = ["360p", "480p", "720p", "1080p", "4K"];

export const PLAN_ACCESS = {
    basic: { label: "Basic", maxQuality: "720p", canDownload: false },
    standard: { label: "Standard", maxQuality: "1080p", canDownload: true },
    premium: { label: "Premium", maxQuality: "4K", canDownload: true },
};

export const NO_ACCESS = { label: "Free", maxQuality: null, canDownload: false };

export const planAccess = (plan) => PLAN_ACCESS[plan] || NO_ACCESS;

export const isQualityWithinPlan = (quality, maxQuality) => {
    if (!maxQuality) return false;
    const ceiling = QUALITY_LADDER.indexOf(maxQuality);
    const asked = QUALITY_LADDER.indexOf(quality);
    return ceiling !== -1 && asked !== -1 && asked <= ceiling;
};
