const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    variant: {
        type: String,
        required: true,
        enum: ['ticket_progress', 'ticket_resolved', 'sub_expiring', 'sub_expired'],
    },
    message: { type: String, required: true },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
    //! guards against duplicate notifications for the same underlying event —
    //! a ticket re-saved to a status it was already set to, or `entitlementFor`
    //! re-checking the same subscription window on every page load. Scoped per
    //! user via the compound index below, not globally unique.
    dedupeKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notifications', notificationSchema);
