const { Router } = require('express');

const {
    getOverview, getBookings, refundBooking, getUsers, setUserRole,
    getMovies, getSeries, getPeople, getReviews, moderateReview, moderateReviews, setReviewSpoiler, deleteReview,
    getPayments, search,
} = require('../controller/adminController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const {
    getCinemas, getCinema, getHall, getSchedule, getBooking, getSchedulableMovies,
} = require('../controller/adminCinemaController');
const {
    getSpotlightSlides, searchSpotlightCandidates, addSpotlightSlide,
    reorderSpotlightSlides, toggleSpotlightSlide, removeSpotlightSlide,
} = require('../controller/adminSpotlightController');
const { setUserRoleValidation, refundValidation } = require('../validation/adminValidation');
const { moderateReviewValidation, moderateManyValidation, setSpoilerValidation } = require('../validation/reviewValidation');

const router = Router();

//! one gate for the whole console rather than a repeated pair on every line —
//! a route added here cannot accidentally be left open
router.use(Authenticate, Authorize(["admin"]));

router.get("/overview", getOverview);
router.get("/search", search);

router.get("/bookings", getBookings);
//! declared before "/bookings/:id", or "payments" would never be reached
router.get("/payments", getPayments);
router.get("/bookings/:id", ValidateObjectId, getBooking);
router.post("/bookings/:id/refund", [ValidateObjectId, refundValidation], refundBooking);

//? Cinema
router.get("/cinemas", getCinemas);
router.get("/cinemas/:id", ValidateObjectId, getCinema);
router.get("/halls/:id", ValidateObjectId, getHall);
router.get("/schedule", getSchedule);
//! runtimes, which the screening form needs to work out an end time
router.get("/schedulable-movies", getSchedulableMovies);

router.get("/users", getUsers);
router.patch("/users/:id/role", [ValidateObjectId, setUserRoleValidation], setUserRole);

router.get("/movies", getMovies);
router.get("/series", getSeries);
router.get("/people", getPeople);

router.get("/reviews", getReviews);
//! declared before "/:id/status" so "status" is never read as a review id
router.patch("/reviews/status", moderateManyValidation, moderateReviews);
router.patch("/reviews/:id/status", [ValidateObjectId, moderateReviewValidation], moderateReview);
router.patch("/reviews/:id/spoiler", [ValidateObjectId, setSpoilerValidation], setReviewSpoiler);
router.delete("/reviews/:id", ValidateObjectId, deleteReview);

//? Spotlight
router.get("/spotlight", getSpotlightSlides);
//! declared before "/spotlight/reorder", or "reorder" would be read as a slide id
router.get("/spotlight/search", searchSpotlightCandidates);
router.post("/spotlight", addSpotlightSlide);
router.patch("/spotlight/reorder", reorderSpotlightSlides);
router.patch("/spotlight/:id", ValidateObjectId, toggleSpotlightSlide);
router.delete("/spotlight/:id", ValidateObjectId, removeSpotlightSlide);

module.exports = router;
