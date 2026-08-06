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
    const viewerId = req.user ? req.user.id : null;

    try {
        //! everyone sees what has been approved — plus, if they are signed in,
        //! their own review while it waits. Otherwise posting one looks like it
        //! silently failed, and they write it again.
        const visible = viewerId
            ? { media: req.params.id, $or: [{ status: 'approved' }, { user: viewerId }] }
            : { media: req.params.id, status: 'approved' };

        const reviews = await Review.find(visible)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .select("-email -moderatedBy -rejectionReason");

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            total: reviews.length,
            //! toObject rather than lean: the isSpoiler virtual is the whole
            //! point, and lean() drops virtuals
            reviews: reviews.map(review => shapeForReader(review.toObject(), viewerId)),
        });
    }
    catch (err) {
        res.status(404).json({
            status: 404,
            message: err
        });
    }
};

/**
 * What a reader is allowed to know about a review. The list of who reported it
 * never leaves the server — only whether it crossed the line, and whether this
 * particular reader was one of them, so the button can show its own state.
 */
const shapeForReader = (review, viewerId) => {
    const reports = review.spoiler?.reports || [];
    const { spoiler, ...rest } = review;

    return {
        ...rest,
        isSpoiler: review.isSpoiler,
        spoiler: {
            byAuthor: Boolean(spoiler?.byAuthor),
            reportCount: reports.length,
            reportedByYou: viewerId ? reports.some(id => String(id) === viewerId) : false,
        },
        isMine: viewerId ? String(review.user) === viewerId : false,
    };
};

//! front-end pagination functionality
// const fetchReviews = async (movieId, page = 1, limit = 4) => {
//     const res = await fetch(`/api/reviews?movieId=${movieId}&page=${page}&limit=${limit}`);
//     const data = await res.json();
//     return data;
// };

exports.createReview = async (req, res) => {
    //! must send review category in the request body => [movie or series]

    try {
        const { spoiler, status, ...body } = req.body;

        const newReview = await Review.create({
            ...body,
            user: req.user.id,
            //! status is never taken from the request — that would let anyone
            //! publish straight past moderation
            status: 'pending',
            spoiler: { byAuthor: Boolean(spoiler), reports: [] },
        });

        res.status(201).json({
            status: 201,
            message: 'Thanks — your review will appear once it has been checked',
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


/**
 * A reader saying "this gives something away". Idempotent, and never counts the
 * author: marking your own review as a spoiler is what the checkbox on the form
 * is for, and letting it count here would make the threshold meaningless.
 */
exports.reportSpoiler = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ status: 404, message: 'No review found with that ID' });

        if (String(review.user) === req.user.id) {
            return res.status(409).json({ status: 409, message: "Use the spoiler box on your own review" });
        }
        if (review.status !== 'approved') {
            return res.status(409).json({ status: 409, message: "That review isn't published" });
        }

        //! $addToSet is what makes a second press a no-op rather than a
        //! second vote
        await Review.updateOne(
            { _id: review._id },
            { $addToSet: { 'spoiler.reports': req.user.id } }
        );

        const updated = await Review.findById(req.params.id);

        res.status(200).json({
            status: 200,
            message: 'Thanks — we hid it behind a warning',
            isSpoiler: updated.isSpoiler,
            reportCount: updated.spoilerReportCount,
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
};

exports.withdrawSpoilerReport = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ status: 404, message: 'No review found with that ID' });

        await Review.updateOne(
            { _id: review._id },
            { $pull: { 'spoiler.reports': req.user.id } }
        );

        const updated = await Review.findById(req.params.id);

        res.status(200).json({
            status: 200,
            message: 'Your report was withdrawn',
            isSpoiler: updated.isSpoiler,
            reportCount: updated.spoilerReportCount,
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
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