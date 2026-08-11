const express = require('express');
const { createEpisode, getEpisodeById, updateEpisode, deleteEpisode, getEpisodeByEpisodeNumber, downloadEpisode, } = require('../controller/episodeController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const RequireSubscription = require('../middleware/RequireSubscription');

const router = express.Router();

router
    .route('/')
    .post([Authenticate, Authorize(["admin"])], createEpisode);

router
    .route('/:id')
    .get(ValidateObjectId, getEpisodeById)
    .put([Authenticate, Authorize(["admin"])], ValidateObjectId, updateEpisode)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteEpisode);

router.get("/:series/:season/:episodeNumber", getEpisodeByEpisodeNumber);
//! the paywall: this endpoint hands over the actual file, so it checks the
//! live subscription rather than relying on the UI having hidden the button
router.post("/download", [Authenticate, RequireSubscription({ requireDownload: true })], downloadEpisode);

module.exports = router;