const mongoose = require('mongoose');
const { SEAT_TIERS } = require('../constants/seatTiers');

const seatSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: [true, 'Seat number is required'],
    },
    tier: {
        type: String,
        enum: SEAT_TIERS,
        default: 'standard',
    },
    //! aisles, walkways or out-of-service seats: rendered as a gap, never bookable
    disabled: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

const rowSchema = new mongoose.Schema({
    row: {
        type: String,
        required: [true, 'Row label is required'],
        uppercase: true,
        trim: true,
    },
    seats: {
        type: [seatSchema],
        default: [],
    },
}, { _id: false });

const hallSchema = new mongoose.Schema({
    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinemas',
        required: [true, 'Cinema is required'],
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Hall name is required'],
        trim: true,
    },
    screenType: {
        type: String,
        enum: ['2D', '3D', 'IMAX', '4DX'],
        default: '2D',
    },
    seatMap: {
        type: [rowSchema],
        default: [],
    },
}, { timestamps: true });

//! bookable seats only — disabled ones are layout gaps, not inventory.
//! undefined when the hall was fetched without its seat map (a partial populate),
//! since the count genuinely isn't knowable from the loaded fields
hallSchema.virtual('totalSeats').get(function () {
    if (!Array.isArray(this.seatMap)) return undefined;

    return this.seatMap.reduce(
        (total, row) => total + row.seats.filter(seat => !seat.disabled).length,
        0
    );
});

hallSchema.set('toJSON', { virtuals: true });
hallSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Halls', hallSchema);
