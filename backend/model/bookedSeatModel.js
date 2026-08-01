const mongoose = require('mongoose');

/**
 * One document per claimed seat. This collection exists purely so the database
 * can arbitrate who gets a seat: the unique index below is what actually
 * prevents two people buying the same seat, which a read-then-write check in
 * application code cannot do. Mongo runs standalone here, so transactions
 * aren't available and the unique index is the only real guarantee.
 */
const bookedSeatSchema = new mongoose.Schema({
    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtimes',
        required: true,
    },
    seatLabel: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bookings',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    //! set while the seat is only held; cleared on confirmation so the seat
    //! becomes permanent. Mongo's TTL monitor ignores documents where this
    //! isn't a date, so confirmed seats are never swept.
    expiresAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

//! the actual concurrency guarantee
bookedSeatSchema.index({ showtime: 1, seatLabel: 1 }, { unique: true });

//! abandoned holds release themselves without a cron job
bookedSeatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BookedSeats', bookedSeatSchema);
