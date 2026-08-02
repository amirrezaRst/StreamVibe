const express = require('express');
const { like, unlike, likeStatus, getLikes, getMyLikes } = require('../controller/likeController');
const Authenticate = require('../middleware/Authenticate');
const { likeValidation, unlikeValidation } = require('../validation/likeValidation');

const router = express.Router();

router.post("/like", Authenticate, likeValidation, like);
router.post("/unlike", Authenticate, unlikeValidation, unlike);

router.get("/mine", Authenticate, getMyLikes);
router.get("/status/:userId/:media", likeStatus);
router.get("/getLikes/:media", getLikes);


module.exports = router;