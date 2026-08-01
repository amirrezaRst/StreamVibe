const express = require('express');
const { getAllReviews, createReview, updateReview, deleteReview, getMovieReview } = require('../controller/reviewController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const { createReviewValidation } = require('../validation/reviewValidation');

const router = express.Router();

router.get("/allReview", getAllReviews);

router.route("/")
    .post(Authenticate, createReviewValidation, createReview);

router
    .route('/:id')
    .get(ValidateObjectId, getMovieReview)
    .put(Authenticate, ValidateObjectId, updateReview)
    .delete(Authenticate, ValidateObjectId, deleteReview);

module.exports = router;