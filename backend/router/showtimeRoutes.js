const { Router } = require('express');
const { getShowtimesByMovie, getShowtime, createShowtime, updateShowtime, deleteShowtime } = require('../controller/showtimeController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { createShowtimeValidation, updateShowtimeValidation } = require('../validation/cinemaValidation');

const router = Router();
const adminOnly = [Authenticate, Authorize(["admin"])];


//! declared before /:id so "movie" isn't swallowed as a showtime id
router.get("/movie/:movieId", ValidateObjectId.param('movieId'), getShowtimesByMovie);

router.route("/")
    .post(adminOnly, createShowtimeValidation, createShowtime);

router.route("/:id")
    .get(ValidateObjectId, getShowtime)
    .put(adminOnly, ValidateObjectId, updateShowtimeValidation, updateShowtime)
    .delete(adminOnly, ValidateObjectId, deleteShowtime);


module.exports = router;
