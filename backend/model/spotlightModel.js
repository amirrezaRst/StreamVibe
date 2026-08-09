const mongoose = require('mongoose');

/**
 * One row of the /explore hero carousel. Deliberately thin — a reference to
 * an existing movie or series plus where it sits and whether it's live —
 * because the carousel has no content of its own to author. Title, synopsis,
 * poster, genres and rating all come from the referenced record itself, so
 * editing a film's description updates its spotlight card for free.
 *
 * `kind` mirrors the exact convention the watchlist already uses
 * (userModel.watchList) rather than inventing a second vocabulary for the
 * same movie/series distinction.
 */
const spotlightModel = mongoose.Schema({
    kind: {
        type: String,
        enum: ['Movies', 'Series'],
        required: true,
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'kind',
        required: true,
    },
    //! lower sorts first; admin-set via drag-reorder, not user-facing
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    //! pulling a title for a while without losing its place in the order —
    //! toggled off rather than deleted
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

spotlightModel.index({ kind: 1, media: 1 }, { unique: true });

module.exports = mongoose.model('Spotlight', spotlightModel);
