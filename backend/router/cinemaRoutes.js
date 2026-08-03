const { Router } = require('express');
const { getCities, getCinemas, getCinema, createCinema, updateCinema, deleteCinema } = require('../controller/cinemaController');
const { getHall, createHall, updateHall, deleteHall } = require('../controller/hallController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const {
    createCinemaValidation, updateCinemaValidation,
    createHallValidation, updateHallValidation,
} = require('../validation/cinemaValidation');

const router = Router();
const adminOnly = [Authenticate, Authorize(["admin"])];


//? Halls — declared before /:id so "halls" isn't swallowed as a cinema id
router.route("/halls")
    .post(adminOnly, createHallValidation, createHall);

router.route("/halls/:id")
    .get(ValidateObjectId, getHall)
    .put(adminOnly, ValidateObjectId, updateHallValidation, updateHall)
    .delete(adminOnly, ValidateObjectId, deleteHall);


//? Cinemas
router.get("/cities", getCities);

router.route("/")
    .get(getCinemas)
    .post(adminOnly, createCinemaValidation, createCinema);

router.route("/:id")
    .get(ValidateObjectId, getCinema)
    .put(adminOnly, ValidateObjectId, updateCinemaValidation, updateCinema)
    .delete(adminOnly, ValidateObjectId, deleteCinema);


module.exports = router;
