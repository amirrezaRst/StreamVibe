const express = require('express');
const { getAllDirectors, getDirector, updateDirector, deleteDirector, createDirector, getDirectorMovies, getDirectorSeries } = require('../controller/directorController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const resolveBySlug = require('../middleware/ResolveBySlug');

//! public reads take a slug or an _id; writes below stay _id-only
const resolveDirector = resolveBySlug(require('../model/directorModel'));
const Authorize = require('../middleware/Authorize');
const Authenticate = require('../middleware/Authenticate');

const router = express.Router();


router.get("/directorList", getAllDirectors);
router.post("/", [Authenticate, Authorize(["admin"])], createDirector);
router.get("/seriesList/:id", resolveDirector, getDirectorSeries);
router.get("/moviesList/:id", resolveDirector, getDirectorMovies);

router
    .route('/:id')
    .get(resolveDirector, getDirector)
    .put([ValidateObjectId, Authenticate, Authorize(["admin"])], updateDirector)
    .delete([ValidateObjectId, Authenticate, Authorize(["admin"])], deleteDirector);

module.exports = router;