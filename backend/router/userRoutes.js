const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { singleUser, registerUser, login, deleteUser, allUser, getWatchList, logout, refreshToken, freeTrial, addSubscription } = require('../controller/userController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { registerValidation, loginValidation, addSubscriptionValidation } = require('../validation/userValidation');

const router = Router();

//! throttle brute-force attempts against login/register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: "Too many attempts, please try again later." },
});


router.get("/users", [Authenticate, Authorize(["admin"])], allUser);

router.get("/getWatchList/:id", Authenticate, ValidateObjectId, getWatchList);

router.get("/userData", singleUser);
router.route("/user/:id")
    .delete(ValidateObjectId, [Authenticate, Authorize(["admin"])], deleteUser);
//! must add edit user route here

router.post("/register", authLimiter, registerValidation, registerUser);
router.post("/login", authLimiter, loginValidation, login);
router.post('/logout', logout);
router.get("/refreshToken", refreshToken);

//? Subscription Route
router.post("/addSubscription/:id", [Authenticate, ValidateObjectId, addSubscriptionValidation], addSubscription);


module.exports = router;