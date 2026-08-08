const mongoose = require('mongoose');
const slugPlugin = require('./plugins/slugPlugin');
const shortid = require('shortid');

const actorModel = mongoose.Schema({
    //! the public URL for this record. Generated once on creation and then
    //! left alone — renaming must not change an address that is already
    //! linked or indexed. Sparse so records predating slugs don't collide on
    //! a shared null while the backfill runs.
    slug: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    actorId: {
        type: String,
        default: shortid.generate,
        // required: [true, 'Actor ID is required'],
    },
    fullName: {
        type: String,
        required: [true, 'Full Name is required'],
    },
    birthDate: {
        type: String,
        required: [true, 'Date of Birth is required'],
    },
    birthPlace: {
        type: String,
        default: "",
        // required: [true, 'Place of Birth is required'],
    },
    bio: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, 'Gender is required'],
    },
    country: {
        type: String,
        default: "",
        // required: [true, 'Country is required']
    },
    profile: {
        type: String,
        required: [true, 'Profile is required']
    },
    awards: [{
        name: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
    }],
    death_date: {
        type: Date,
        required: false
    },
});

actorModel.plugin(slugPlugin, { source: 'fullName' });

module.exports = mongoose.model('Actors', actorModel);