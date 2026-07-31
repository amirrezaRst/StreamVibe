const mongoose = require('mongoose');

const reviewModel = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: [true, 'User is required'],
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Media is required'],
    },
    text: {
        type: String,
        required: [true, 'Text is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 0,
        max: 5
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reviews', reviewModel);