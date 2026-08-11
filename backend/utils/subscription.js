const userModel = require('../model/userModel');
const { planCapabilities, NO_ACCESS } = require('../constants/plans');

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
        return { active: false, plan: subscription.plan, capabilities: NO_ACCESS };
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
