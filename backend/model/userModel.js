const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const subscriptionSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'expired',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    plan: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
    },
});

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please enter your full name'],
        min: [3, 'Full name must be at least 3 characters'],
        max: [50, 'Full name must be at most 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: [true, 'Email already exists'],
        lowercase: [true, 'Email must be in lowercase'],
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        min: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    refreshToken: { type: String, select: false },
    bookMark: {
        type: Array,
        default: [],
    },
    watchList: [{
        kind: {
            type: String,
            enum: ['Movies', 'Series'],
            required: true,
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'watchList.kind',
            required: true,
        },
    }],
    subscription: {
        type: subscriptionSchema,
        default: null
    },
    timeTrial: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
});


userSchema.pre("save", function (next) {
    let user = this;

    if (!user.isModified("password")) return next();

    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) return next(err);

        user.password = hash;
        next();
    });
});

module.exports = mongoose.model('Users', userSchema);



//! watchList populate
// User.findById(userId)
//     .populate('watchList.item')
//     .exec(function (err, user) {
//         if (err) return handleError(err);
//         console.log(user);
//     });



//! Update subscription Controller
// const startDate = new Date();
// const endDate = new Date();
// endDate.setDate(startDate.getDate() + 7);  // for a 7-day trial

// User.findByIdAndUpdate(userId, {
//     subscription: {
//         status: 'active',
//         startDate: startDate,
//         endDate: endDate,
//         plan: 'basic',  // replace with the actual plan
//     },
// }, function(err, user) {
//     if (err) return handleError(err);
//     console.log(user);
// });