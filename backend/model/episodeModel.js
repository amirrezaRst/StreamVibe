const mongoose = require('mongoose');

const episodeModel = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    description: {
        type: String,
        default: "",
        require: false
    },
    releaseDate: {
        type: String,
        default: new Date()
        // required: [true, 'Release Date is required'],
    },
    runtime: {
        type: Number,
        required: [true, 'Runtime is required'],
    },
    episodeNumber: {
        type: Number,
        required: [true, 'Episode number is required'],
    },
    seasonNumber: {
        type: Number,
        required: [true, 'Season number is required'],
    },
    series: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Series is required'],
        ref: "Series"
    },
    pictures: [{
        type: String,
        required: [true, 'Picture is required']
    }],
    files: [{
        quality: {
            type: String,
            required: true,
            enum: ['360p', '480p', '720p', '1080p', '4K']
        },
        url: {
            type: String,
            required: true
        },
        //! bytes on disk, captured from multer at upload time. Not required —
        //! files uploaded before this field existed have none, and a backfill
        //! script fills those in from disk rather than the schema forcing a
        //! migration on documents that were already valid
        size: {
            type: Number,
            required: false
        }
    }],
});

module.exports = mongoose.model('Episodes', episodeModel);