const { Router } = require('express');
const { singleUser, registerUser, login, deleteUser, allUser, getWatchList, logout, refreshToken, freeTrial, addSubscription } = require('../controller/userController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { registerValidation, loginValidation, addSubscriptionValidation } = require('../validation/userValidation');

const router = Router();


router.get("/users", [Authenticate, Authorize(["admin"])], allUser);

router.get("/getWatchList/:id", ValidateObjectId, getWatchList);

router.get("/userData", singleUser);
router.route("/user/:id")
    .delete(ValidateObjectId, [Authenticate, Authorize(["admin"])], deleteUser);
//! must add edit user route here

router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, login);
router.post('/logout', logout);
router.get("/refreshToken", refreshToken);

//? Subscription Route
router.post("/addSubscription/:id", [Authenticate, ValidateObjectId, addSubscriptionValidation], addSubscription);


module.exports = router;