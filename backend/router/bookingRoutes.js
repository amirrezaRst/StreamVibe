const { Router } = require('express');
const { holdSeats, confirmBooking, cancelBooking, getMyBookings, getBooking } = require('../controller/bookingController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const { holdSeatsValidation } = require('../validation/bookingValidation');

const router = Router();

//! every booking route is tied to the signed-in user
router.use(Authenticate);

//! declared before /:id so "mine" isn't read as a booking id
router.get("/mine", getMyBookings);

router.post("/", holdSeatsValidation, holdSeats);

router.get("/:id", ValidateObjectId, getBooking);
router.post("/:id/confirm", ValidateObjectId, confirmBooking);
router.post("/:id/cancel", ValidateObjectId, cancelBooking);

module.exports = router;
