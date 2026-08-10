const { Router } = require('express');
const { allActors, browseActors, getActor, createActor, updateActor, deleteActor, getActorMovies, getActorSeries } = require('../controller/actorController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const resolveBySlug = require('../middleware/ResolveBySlug');

//! public reads take a slug or an _id; writes below stay _id-only
const resolveActor = resolveBySlug(require('../model/actorModel'));
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const router = Router();


router.get("/actorList", allActors)
router.get("/browse", browseActors)

router.post("/", [Authenticate, Authorize(["admin"])], createActor);
router.get("/seriesList/:id", resolveActor, getActorSeries);
router.get("/moviesList/:id", resolveActor, getActorMovies);

router.route("/:id")
    .get(resolveActor, getActor)
    .put(ValidateObjectId, [Authenticate, Authorize(["admin"])], updateActor)
    .delete(ValidateObjectId, [Authenticate, Authorize(["admin"])], deleteActor);


module.exports = router;