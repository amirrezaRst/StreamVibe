const mongoose = require('mongoose');
const { SEAT_TIERS } = require('../constants/seatTiers');

//! price per seat tier lives on the showtime, not the hall: a matinee and a
//! friday-night screening use the same seats at different prices
const pricingSchema = new mongoose.Schema(
    SEAT_TIERS.reduce((fields, tier) => {
        fields[tier] = {
            type: Number,
            min: [0, 'Price cannot be negative'],
        };
        return fields;
    }, {}),
    { _id: false }
);

const showtimeSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movies',
        required: [true, 'Movie is required'],
        index: true,
    },
    hall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Halls',
        required: [true, 'Hall is required'],
    },
    //! denormalised from hall.cinema so "showtimes in this city" doesn't need a join
    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinemas',
        required: [true, 'Cinema is required'],
        index: true,
    },
    startsAt: {
        type: Date,
        required: [true, 'Start time is required'],
        index: true,
    },
    endsAt: {
        type: Date,
        required: [true, 'End time is required'],
    },
    pricing: {
        type: pricingSchema,
        required: [true, 'Pricing is required'],
    },
    language: {
        type: String,
        enum: ['original', 'dubbed', 'subtitled'],
        default: 'original',
    },
    currency: {
        type: String,
        default: 'USD',
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled'],
        default: 'scheduled',
    },
}, { timestamps: true });

//! the common lookup: upcoming showtimes for a movie in a city, in time order
showtimeSchema.index({ movie: 1, startsAt: 1 });
showtimeSchema.index({ cinema: 1, startsAt: 1 });

module.exports = mongoose.model('Showtimes', showtimeSchema);
