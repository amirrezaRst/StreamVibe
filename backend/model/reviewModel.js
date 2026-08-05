const mongoose = require('mongoose');
const { SPOILER_REPORTS_NEEDED, REVIEW_STATUSES } = require('../constants/review');

const reviewModel = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: [true, 'User is required'],
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Media is required'],
        index: true
    },
    text: {
        type: String,
        required: [true, 'Text is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 0,
        max: 5
    },
    //! Nothing reaches another reader until somebody has looked at it. A review
    //! is a stranger's words sitting on someone else's page, and the
    //! alternative is abuse being live for however long it takes to notice.
    status: {
        type: String,
        enum: REVIEW_STATUSES,
        default: 'pending',
        index: true,
    },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', default: null },
    //! kept so the author can be told something more useful than "no"
    rejectionReason: { type: String, default: null },

    spoiler: {
        //! the author's own declaration — they know what they wrote
        byAuthor: { type: Boolean, default: false },
        //! a moderator overriding both the author and the readers when one of
        //! them has it wrong; null means they have not intervened
        byModerator: { type: Boolean, default: null },
        //! one entry per reader, so the same person cannot report twice
        reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    },
    date: {
        type: Date,
        default: Date.now
    }
});

//! Order matters: a moderator's decision wins, then the author's own flag, then
//! the readers'. A virtual rather than a stored column, so the threshold can
//! change without rewriting every document.
reviewModel.virtual('isSpoiler').get(function () {
    if (typeof this.spoiler?.byModerator === 'boolean') return this.spoiler.byModerator;
    if (this.spoiler?.byAuthor) return true;

    return (this.spoiler?.reports?.length || 0) >= SPOILER_REPORTS_NEEDED;
});

reviewModel.virtual('spoilerReportCount').get(function () {
    return this.spoiler?.reports?.length || 0;
});

reviewModel.set('toJSON', { virtuals: true });
reviewModel.set('toObject', { virtuals: true });

//! the public list is always "approved reviews for this title"
reviewModel.index({ media: 1, status: 1 });

module.exports = mongoose.model('Reviews', reviewModel);
