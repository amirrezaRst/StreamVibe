const { Router } = require('express');

const { allMusicians, browseMusicians, getMusician, getMusicianMovies, getMusicianSeries, createMusician, updateMusician, deleteMusician } = require('../controller/musicianController');
const resolveBySlug = require('../middleware/ResolveBySlug');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');

const router = Router();

//! public reads take a slug or an _id, same as the other person routes
const resolveMusician = resolveBySlug(require('../model/musicianModel'));

router.get('/musicianList', allMusicians);
router.get('/browse', browseMusicians);
router.get('/seriesList/:id', resolveMusician, getMusicianSeries);
router.get('/moviesList/:id', resolveMusician, getMusicianMovies);

router.post('/', [Authenticate, Authorize(["admin"])], createMusician);

//! reads resolve by slug or id; writes stay id-only, matching actor/director
router.route('/:id')
    .get(resolveMusician, getMusician)
    .put([Authenticate, Authorize(["admin"])], ValidateObjectId, updateMusician)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteMusician);

module.exports = router;
