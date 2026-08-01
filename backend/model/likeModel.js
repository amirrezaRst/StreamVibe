const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    media: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

//! prevents the same user from liking the same media twice under concurrent requests
likeSchema.index({ userId: 1, media: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);