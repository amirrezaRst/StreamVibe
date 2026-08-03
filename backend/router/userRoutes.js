const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { singleUser, registerUser, login, deleteUser, allUser, getWatchList, addToWatchList, removeFromWatchList, watchListStatus, getOverview, updateProfile, changePassword, logout, refreshToken, freeTrial, addSubscription, forgotPassword, resetPassword } = require('../controller/userController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { registerValidation, loginValidation, addSubscriptionValidation, forgotPasswordValidation, resetPasswordValidation, updateProfileValidation, changePasswordValidation, watchListValidation } = require('../validation/userValidation');

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

router.get("/userData", singleUser);
router.route("/user/:id")
    .delete(ValidateObjectId, [Authenticate, Authorize(["admin"])], deleteUser);

//? Profile Routes — always scoped to the caller, never to an id in the path
router.get("/me/overview", Authenticate, getOverview);
router.put("/me", [Authenticate, updateProfileValidation], updateProfile);
router.patch("/me/password", [Authenticate, changePasswordValidation], changePassword);

//? Watchlist Routes
router.route("/watchList")
    .get(Authenticate, getWatchList)
    .post([Authenticate, watchListValidation], addToWatchList);

router.route("/watchList/:itemId")
    .get([Authenticate, ValidateObjectId.param('itemId')], watchListStatus)
    .delete([Authenticate, ValidateObjectId.param('itemId')], removeFromWatchList);

router.post("/register", authLimiter, registerValidation, registerUser);
router.post("/login", authLimiter, loginValidation, login);
router.post('/logout', logout);
router.get("/refreshToken", refreshToken);

//? Password Reset Routes
router.post("/forgotPassword", authLimiter, forgotPasswordValidation, forgotPassword);
router.post("/resetPassword/:token", authLimiter, resetPasswordValidation, resetPassword);

//? Subscription Route
router.post("/addSubscription/:id", [Authenticate, ValidateObjectId, addSubscriptionValidation], addSubscription);


module.exports = router;