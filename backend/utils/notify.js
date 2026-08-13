const Notification = require('../model/notificationModel');

/**
 * Fire-and-forget notification creation. The unique (user, dedupeKey) index
 * on the model is what actually prevents duplicates — this just swallows the
 * expected E11000 when the same event fires again (a ticket re-saved to a
 * status it already had, `entitlementFor` re-checking a subscription it
 * already flagged on the previous page load).
 */
const notify = async ({ user, variant, message, link = null, dedupeKey }) => {
    try {
        await Notification.create({ user, variant, message, link, dedupeKey });
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
};

module.exports = notify;
