const mongoose = require('mongoose');
const slugPlugin = require('./plugins/slugPlugin');


const movieModel = mongoose.Schema({
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
    description: {
        type: String,
        default: "",
        require: false
    },
    director: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directors',
        required: [true, 'Director is required'],
    },
    release_date: {
        type: String,
        required: [true, 'Release Date is required'],
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
    },
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
    production_company: {
        type: String,
        required: [false, 'Production Company is required']
    },
    age_rating: {
        type: String,
        required: [true, 'Age Rating is required']
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
            required: false
        },
        gross: {
            type: Number,
            required: false
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
    files: [{
        quality: {
            type: String,
            required: true,
            enum: ['360p', '480p', '720p', '1080p', '4K']
        },
        url: {
            type: String,
            required: true
        }
    }],
    release_status: {
        type: String,
        enum: ['coming soon', 'now showing'],
        required: [true, 'Release Status is required']
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
})

movieModel.plugin(slugPlugin, { source: 'title', year: 'release_date' });

module.exports = mongoose.model('Movies', movieModel);