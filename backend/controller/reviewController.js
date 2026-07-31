const Review = require('../model/reviewModel');
const User = require('../model/userModel');

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            total: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err
        });
    }
};

exports.getMovieReview = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4; // Default to 4 reviews per page
    const skip = (page - 1) * limit;

    try {
        const reviews = await Review.find({ media: req.params.id })
            .skip(skip)
            .limit(limit)
            .select("-email")
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            total: reviews.length,
            reviews
        });
    }
    catch (err) {
        res.status(404).json({
            status: 404,
            message: err
        });
    }
};

//! front-end pagination functionality
// const fetchReviews = async (movieId, page = 1, limit = 4) => {
//     const res = await fetch(`/api/reviews?movieId=${movieId}&page=${page}&limit=${limit}`);
//     const data = await res.json();
//     return data;
// };

exports.getReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            data: {
                review
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err
        });
    }
};

exports.createReview = async (req, res) => {
    //! must send review category in the request body => [movie or series]

    try {
        const newReview = await Review.create({ ...req.body, user: req.user.id });
        res.status(201).json({
            status: 201,
            message: 'Review created successfully',
            data: {
                review: newReview
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message
        });
    }
};


exports.updateReview = async (req, res) => {
    try {
        const existingReview = await Review.findById(req.params.id);
        if (!existingReview) {
            return res.status(404).json({ status: 404, message: 'No review found with that ID' });
        }
        if (existingReview.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: 403, message: 'You can only edit your own review' });
        }

        const { user, ...updateData } = req.body; //! ownership can't be reassigned via the request body

        const review = await Review.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: 200,
            message: 'Review updated successfully',
            data: {
                review
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({
                status: 404,
                message: 'No review found with that ID'
            });
        }
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: 403, message: 'You can only delete your own review' });
        }

        await review.deleteOne();

        res.status(200).json({
            status: 200,
            message: 'Review deleted successfully',
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};