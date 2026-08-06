const { Router } = require('express');
const { getShowtimesByMovie, getShowtime, getNowPlaying, createShowtime, createShowtimeRun, updateShowtime, deleteShowtime } = require('../controller/showtimeController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { createShowtimeValidation, createShowtimeRunValidation, updateShowtimeValidation } = require('../validation/cinemaValidation');

const router = Router();
const adminOnly = [Authenticate, Authorize(["admin"])];


//! declared before /:id so these aren't swallowed as showtime ids
router.get("/now-playing", getNowPlaying);
router.get("/movie/:movieId", ValidateObjectId.param('movieId'), getShowtimesByMovie);

router.route("/")
    .post(adminOnly, createShowtimeValidation, createShowtime);

//! before /:id, or "run" is read as a showtime id
router.post("/run", adminOnly, createShowtimeRunValidation, createShowtimeRun);

router.route("/:id")
    .get(ValidateObjectId, getShowtime)
    .put(adminOnly, ValidateObjectId, updateShowtimeValidation, updateShowtime)
    .delete(adminOnly, ValidateObjectId, deleteShowtime);


module.exports = router;
