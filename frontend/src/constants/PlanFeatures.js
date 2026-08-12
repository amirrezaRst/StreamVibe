/**
 * The comparison table's source of truth, mirroring backend/constants/plans.js.
 *
 * Every row here is something the server actually enforces — the streaming
 * quality ceiling and download access are checked in RequireSubscription and
 * downloadGuard, not just reflected in the UI. Rows were deliberately not
 * added for things the app cannot enforce (simultaneous devices, offline
 * viewing), which is what the old marketing copy promised and never delivered.
 */
export const PLAN_ORDER = ["basic", "standard", "premium"];

export const PLAN_LABELS = {
    basic: "Basic",
    standard: "Standard",
    premium: "Premium",
};

//! `true`/`false` render as a tick or a dash; a string renders as itself
export const PLAN_FEATURES = [
    {
        label: "Streaming quality",
        hint: "The highest resolution available to play.",
        values: { basic: "up to 720p", standard: "up to 1080p", premium: "up to 4K" },
    },
    {
        label: "Downloads",
        hint: "Save a title and keep it after you close the tab.",
        values: { basic: false, standard: true, premium: true },
    },
    {
        label: "Download quality",
        hint: "Files above your plan's ceiling stay locked.",
        values: { basic: "—", standard: "up to 1080p", premium: "up to 4K" },
    },
    {
        label: "Full catalogue",
        hint: "Every film and series on StreamVibe.",
        values: { basic: true, standard: true, premium: true },
    },
    {
        label: "Watchlist & reviews",
        values: { basic: true, standard: true, premium: true },
    },
    {
        label: "Cinema ticket booking",
        values: { basic: true, standard: true, premium: true },
    },
    {
        label: "Ad-free",
        values: { basic: true, standard: true, premium: true },
    },
];
