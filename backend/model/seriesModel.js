const mongoose = require('mongoose');
const slugPlugin = require('./plugins/slugPlugin');

const seriesModel = mongoose.Schema({
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
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    musician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Musicians',
        required: false,
    },
    director: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Director is required'],
        ref: "Directors"
    },
    description: {
        type: String,
        default: "",
        require: false
    },
    release_date: {
        type: String,
        required: [true, 'Release Date is required'],
    },
    seasons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seasons'
    }],
    genres: {
        type: [String],
        enum: [
            'action',
            'comedy',
            'drama',
            'horror',
            'science fiction',
            'fantasy',
            'romance',
            'thriller',
            'mystery',
            'documentary',
            'adventure',
            'crime',
            'musical',
            'western',
            'animation',
            'war'
        ],
        required: [true, 'Genres is required'],
    },
    category: {
        type: [String],
        enum: [
            'action',
            'comedy',
            'drama',
            'horror',
            'science fiction',
            'fantasy',
            'romance',
            'thriller',
            'mystery',
            'documentary',
            'adventure',
            'crime',
            'musical',
            'western',
            'animation',
            'war'
        ],
        required: [true, 'Category is required'],
        index: true
    },
    country: {
        type: String,
        required: [true, 'Country is required']
    },
    language: {
        type: String,
        required: [true, 'Language is required']
    },
    //! Must change
    production_company: {
        type: String,
        default: null
        // required: [true, 'Production Company is required']
    },
    age_rating: {
        type: String,
        default: null
        // required: [true, 'Age Rating is required']
    },
    rotten_rating: {
        type: Number,
        required: [true, 'Rotten Rating is required']
    },
    imdb_rating: {
        type: Number,
        required: [true, 'IMDB Rating is required']
    },
    awards: [{
        name: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        }
    }],
    boxOffice: {
        budget: {
            type: Number,
            // required: true
        },
        gross: {
            type: Number,
            // required: true
        }
    },
    top250rank: {
        type: Number,
        required: false,
        min: 1,
        max: 250
    },
    pictures: {
        type: [String],
        required: false
    },
    thumbnail: {
        type: String,
        required: [true, 'Thumbnail is required']
    },
    cover: {
        type: String,
        required: [true, 'Cover is required!']
    },
    trailer: {
        type: String,
        required: [true, 'Trailer is required']
    },
    release_status: {
        type: String,
        enum: ['now showing', 'coming soon', 'expired'],
        // required: [true, 'Release Status is required']
        default: 'now showing'
    },
    publish_date: {
        type: Date,
        default: Date.now,
        index: true
    },
    views: {
        type: Number,
        default: 0,
        index: true
    },
    actors: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        required: false,
        ref: "Actors"
    },
});

seriesModel.plugin(slugPlugin, { source: 'title', year: 'release_date' });

module.exports = mongoose.model('Series', seriesModel);