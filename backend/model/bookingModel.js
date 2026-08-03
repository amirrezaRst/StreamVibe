const mongoose = require('mongoose');
const crypto = require('crypto');
const { SEAT_TIERS } = require('../constants/seatTiers');

//! no 0/O/1/I — these get read aloud and typed in at a counter
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const generateBookingCode = () => {
    const bytes = crypto.randomBytes(8);
    const code = [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    return `SV-${code}`;
};

const bookedSeatDetailSchema = new mongoose.Schema({
    label: { type: String, required: true, uppercase: true },
    tier: { type: String, enum: SEAT_TIERS, required: true },
    //! copied from the showtime at booking time: the ticket price must not
    //! change if the showtime is repriced later
    price: { type: Number, required: true, min: 0 },
}, { _id: false });

//! What the gateway did, kept on the booking rather than in its own collection:
//! a booking has exactly one payment attempt that matters, and every question
//! anyone asks ("was this paid?", "how much came back?") is a question about
//! the booking.
const paymentSchema = new mongoose.Schema({
    provider: { type: String, default: 'stripe' },
    status: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid',
    },
    //! the Checkout session is reused if the user presses Pay twice, which is
    //! what stops a second press from opening a second chargeable page
    sessionId: { type: String, default: null, index: true },
    intentId: { type: String, default: null },
    //! stored in major units to match totalPrice; the gateway's minor units
    //! are converted at the boundary
    amount: { type: Number, default: null, min: 0 },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtimes',
        required: true,
        index: true,
    },
    seats: {
        type: [bookedSeatDetailSchema],
        required: true,
        validate: [seats => seats.length > 0, 'A booking needs at least one seat'],
    },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'expired'],
        default: 'pending',
        index: true,
    },
    bookingCode: {
        type: String,
        unique: true,
        default: generateBookingCode,
    },
    payment: {
        type: paymentSchema,
        default: () => ({}),
    },
    //! mirrors the hold on the seats; cleared once confirmed
    expiresAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
}, { timestamps: true });

//! a pending booking whose hold has lapsed is expired, whatever the stored
//! status says — the TTL monitor only runs about once a minute
bookingSchema.virtual('isExpired').get(function () {
    return this.status === 'pending' && this.expiresAt instanceof Date && this.expiresAt <= new Date();
});

bookingSchema.methods.effectiveStatus = function () {
    return this.isExpired ? 'expired' : this.status;
};

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bookings', bookingSchema);
