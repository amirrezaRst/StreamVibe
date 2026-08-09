const { Router } = require('express');

const { getSpotlight } = require('../controller/spotlightController');

const router = Router();

router.get('/', getSpotlight);

module.exports = router;
