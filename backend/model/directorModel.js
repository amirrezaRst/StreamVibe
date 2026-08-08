const mongoose = require('mongoose');
const slugPlugin = require('./plugins/slugPlugin');
const shortid = require('shortid');

const directorSchema = new mongoose.Schema({
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
    directorId: {
        type: String,
        default: shortid.generate,
    },
    fullName: {
        type: String,
        required: [true, 'full name is required'],
    },
    birthDate: {
        type: String, //!Date
        required: [true, 'birth date is required'],
    },
    birthPlace: {
        type: String,
        required: [true, 'birth place is required'],
    },
    bio: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, 'gender is required'],
    },
    country: {
        type: String,
        required: [true, 'country is required'],
    },
    profile: {
        type: String,
        required: [true, 'Profile is required'],
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

directorSchema.plugin(slugPlugin, { source: 'fullName' });

module.exports = mongoose.model('Directors', directorSchema);