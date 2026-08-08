const mongoose = require('mongoose');
const slugPlugin = require('./plugins/slugPlugin');
const shortid = require('shortid');

/**
 * The composer credited on a film or series. Modelled on the director schema
 * rather than invented separately — a composer is the same kind of record as
 * a director, and the person pages render all three roles through one layout.
 */
const musicianSchema = new mongoose.Schema({
    slug: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    musicianId: {
        type: String,
        default: shortid.generate,
    },
    fullName: {
        type: String,
        required: [true, 'full name is required'],
    },
    birthDate: {
        type: String,
        required: [true, 'birth date is required'],
    },
    birthPlace: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, 'gender is required'],
    },
    country: {
        type: String,
        default: "",
    },
    profile: {
        type: String,
        required: [true, 'Profile is required'],
    },
    awards: [{
        name: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
    }],
    death_date: {
        type: Date,
        required: false,
    },
});

musicianSchema.plugin(slugPlugin, { source: 'fullName' });

module.exports = mongoose.model('Musicians', musicianSchema);
