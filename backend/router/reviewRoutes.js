const express = require('express');
const { getAllReviews, createReview, updateReview, deleteReview, getMovieReview, reportSpoiler, withdrawSpoilerReport } = require('../controller/reviewController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const AttachUser = require('../middleware/AttachUser');
const { createReviewValidation } = require('../validation/reviewValidation');

const router = express.Router();

router.get("/allReview", getAllReviews);

router.route("/")
    .post(Authenticate, createReviewValidation, createReview);

//! a reader saying "this gives something away"
router.route('/:id/spoiler')
    .post([Authenticate, ValidateObjectId], reportSpoiler)
    .delete([Authenticate, ValidateObjectId], withdrawSpoilerReport);

router
    .route('/:id')
    //! open to anyone, but AttachUser lets a signed-in reader also see their own
    //! review while it waits for approval, and lights up the report button they
    //! have already pressed
    .get([AttachUser, ValidateObjectId], getMovieReview)
    .put(Authenticate, ValidateObjectId, updateReview)
    .delete(Authenticate, ValidateObjectId, deleteReview);

module.exports = router;
