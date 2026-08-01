const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Cinema name is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        index: true,
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    location: {
        lat: { type: Number },
        lng: { type: Number },
    },
    image: {
        type: String,
        default: "",
    },
    amenities: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Cinemas', cinemaSchema);
