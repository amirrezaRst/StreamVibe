const { resolveEntitlement } = require('../utils/subscription');

/**
 * Guards the endpoints that hand over actual content — streaming a title and
 * downloading a file. Browsing the catalogue stays open to everyone; this is
 * only the paywall itself.
 *
 * Runs after Authenticate, so `req.user` is already the decoded token. The
 * entitlement is re-read from the database rather than trusted from that
 * token: a JWT issued while someone was subscribed would otherwise keep
 * working for its full lifetime after the subscription lapsed.
 *
 * Attaches `req.entitlement` so the handler can shape its response to the
 * plan (which download qualities to offer) without a second lookup.
 */
const RequireSubscription = ({ requireDownload = false } = {}) => async (req, res, next) => {
    try {
        const entitlement = await resolveEntitlement(req.user?.id);

        if (!entitlement.active) {
            return res.status(402).json({
                status: 402,
                message: 'An active StreamVibe subscription is required to watch this.',
                reason: 'no_subscription',
            });
        }

        if (requireDownload && !entitlement.capabilities.canDownload) {
            return res.status(403).json({
                status: 403,
                message: `Downloads are not included in the ${entitlement.capabilities.label} plan.`,
                reason: 'plan_excludes_downloads',
                plan: entitlement.plan,
            });
        }

        req.entitlement = entitlement;
        next();
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = RequireSubscription;
