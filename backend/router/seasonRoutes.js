const express = require('express');
const { createSeason, getSeason, updateSeason, deleteSeason, getSeasonsBySeries } = require('../controller/seasonController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { createSeasonValidation } = require('../validation/seasonValidation');

const router = express.Router();

router.route('/')
    .post([Authenticate, Authorize(["admin"])], createSeasonValidation, createSeason);

router.route('/seasons/:seriesId')
    .get(getSeasonsBySeries);

router.route('/:id')
    .get(ValidateObjectId, getSeason)
    .put([Authenticate, Authorize(["admin"])], ValidateObjectId, updateSeason)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteSeason);

module.exports = router;