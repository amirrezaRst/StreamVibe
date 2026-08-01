const express = require('express');
const { createEpisode, getEpisodeById, updateEpisode, deleteEpisode, getEpisodeByEpisodeNumber, downloadEpisode, } = require('../controller/episodeController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');

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
router.post("/download", downloadEpisode);

module.exports = router;