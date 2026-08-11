const { Router } = require('express');
const { allMovies, singleMovie, createMovie, updateMovie, deleteMovie, movieCategories, topRatedMovies, trendingMovies, newReleased, popularMovies, downloadMovie, getMoviesByGenre } = require('../controller/movieController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const resolveBySlug = require('../middleware/ResolveBySlug');

//! public reads take a slug or an _id; writes below stay _id-only
const resolveMovie = resolveBySlug(require('../model/movieModel'));
const Authorize = require('../middleware/Authorize');
const Authenticate = require('../middleware/Authenticate');
const RequireSubscription = require('../middleware/RequireSubscription');

const router = Router();

router.route("/")
    .get(allMovies)
    .post([Authenticate, Authorize(["admin"])], createMovie);

router.get("/categories", movieCategories);
router.get("/top-rated", topRatedMovies);
router.get("/trending-movies", trendingMovies)
router.get("/new-released", newReleased);
router.get("/popular-movies", popularMovies);
router.get("/moviesByGenre/:genre", getMoviesByGenre);

//! the paywall: this endpoint hands over the actual file, so it checks the
//! live subscription rather than relying on the UI having hidden the button
router.post("/download", [Authenticate, RequireSubscription({ requireDownload: true })], downloadMovie);

router.route("/:id")
    .get(resolveMovie, singleMovie)
    .put([Authenticate, Authorize(["admin"])], ValidateObjectId, updateMovie)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteMovie);

module.exports = router;