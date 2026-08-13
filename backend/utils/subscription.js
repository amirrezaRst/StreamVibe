const userModel = require('../model/userModel');
const { planCapabilities, PLANS, NO_ACCESS } = require('../constants/plans');
const notify = require('./notify');

const EXPIRING_SOON_DAYS = 3;

const daysUntil = (date) => Math.ceil((new Date(date) - Date.now()) / (1000 * 60 * 60 * 24));

const planLabel = (plan) => PLANS[plan]?.label || plan;

/**
 * Reading a subscription is also where it expires.
 *
 * `status` was only ever written at purchase time and never revisited, so a
 * 7-day trial bought once stayed 'active' forever. Rather than add a cron the
 * deploy would have to keep alive, the check happens on read: any record whose
 * `endDate` has passed is flipped to 'expired' the first time anyone looks at
 * it. That makes the flag self-healing — there is no window where the database
 * says 'active' and the app disagrees.
 */
const hasExpired = (subscription) =>
    !!subscription?.endDate && new Date(subscription.endDate) <= new Date();

/**
 * Derives entitlement from an already-loaded user, persisting an expiry if one
 * is due. Split from resolveEntitlement so callers that have the document in
 * hand (the /userData endpoint) don't pay for a second query to learn what
 * they already fetched.
 */
const entitlementFor = async (user) => {
    const subscription = user?.subscription;

    if (!subscription || subscription.status !== 'active') {
        return { active: false, plan: subscription?.plan || null, capabilities: NO_ACCESS };
    }

    if (hasExpired(subscription)) {
        //! targeted update rather than user.save(): the caller's document may
        //! have been loaded with a projection, and saving it whole would be a
        //! much broader write than this one field warrants
        await userModel.updateOne({ _id: user._id }, { 'subscription.status': 'expired' });
        //! keep the in-memory copy honest too, so a caller that goes on to
        //! serialise this user doesn't ship the stale 'active' to the client
        subscription.status = 'expired';

        await notify({
            user: user._id,
            variant: 'sub_expired',
            message: `Your ${planLabel(subscription.plan)} plan has expired. Renew anytime to pick up where you left off.`,
            link: '/subscriptions',
            dedupeKey: `sub-expired:${new Date(subscription.endDate).toISOString()}`,
        });

        return { active: false, plan: subscription.plan, capabilities: NO_ACCESS };
    }

    //! same "check on read" philosophy as the expiry flip above, rather than a
    //! cron that would have to be kept alive separately just to catch this
    //! window — whichever page load happens to land inside the last
    //! EXPIRING_SOON_DAYS creates the warning, deduped per endDate so renewing
    //! (which changes endDate) is what clears the way for the next one
    const daysLeft = subscription.endDate ? daysUntil(subscription.endDate) : null;
    if (daysLeft !== null && daysLeft <= EXPIRING_SOON_DAYS) {
        await notify({
            user: user._id,
            variant: 'sub_expiring',
            message: `Your ${planLabel(subscription.plan)} plan expires in ${daysLeft <= 1 ? '1 day' : `${daysLeft} days`}. Renew to keep your current quality and downloads.`,
            link: '/subscriptions',
            dedupeKey: `sub-expiring:${new Date(subscription.endDate).toISOString()}`,
        });
    }

    return {
        active: true,
        plan: subscription.plan,
        endDate: subscription.endDate,
        capabilities: planCapabilities(subscription.plan),
    };
};

/**
 * Resolves a user's live entitlement by id. Returns the capability object from
 * constants/plans.js, so callers ask "what can this user do" rather than
 * re-deriving it from plan strings.
 */
const resolveEntitlement = async (userId) => {
    if (!userId) return { active: false, plan: null, capabilities: NO_ACCESS };

    const user = await userModel.findById(userId).select('subscription');
    if (!user) return { active: false, plan: null, capabilities: NO_ACCESS };

    return entitlementFor(user);
};

module.exports = { resolveEntitlement, entitlementFor, hasExpired };
