const { Router } = require('express');

const {
    getOverview, getBookings, refundBooking, getUsers, setUserRole,
    getMovies, getSeries, getReviews, deleteReview,
} = require('../controller/adminController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { setUserRoleValidation, refundValidation } = require('../validation/adminValidation');

const router = Router();

//! one gate for the whole console rather than a repeated pair on every line —
//! a route added here cannot accidentally be left open
router.use(Authenticate, Authorize(["admin"]));

router.get("/overview", getOverview);

router.get("/bookings", getBookings);
router.post("/bookings/:id/refund", [ValidateObjectId, refundValidation], refundBooking);

router.get("/users", getUsers);
router.patch("/users/:id/role", [ValidateObjectId, setUserRoleValidation], setUserRole);

router.get("/movies", getMovies);
router.get("/series", getSeries);

router.get("/reviews", getReviews);
router.delete("/reviews/:id", ValidateObjectId, deleteReview);

module.exports = router;
