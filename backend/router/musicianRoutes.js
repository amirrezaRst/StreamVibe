const { Router } = require('express');

const { allMusicians, getMusician, getMusicianMovies, getMusicianSeries } = require('../controller/musicianController');
const resolveBySlug = require('../middleware/ResolveBySlug');

const router = Router();

//! public reads take a slug or an _id, same as the other person routes
const resolveMusician = resolveBySlug(require('../model/musicianModel'));

router.get('/musicianList', allMusicians);
router.get('/seriesList/:id', resolveMusician, getMusicianSeries);
router.get('/moviesList/:id', resolveMusician, getMusicianMovies);

router.get('/:id', resolveMusician, getMusician);

module.exports = router;
