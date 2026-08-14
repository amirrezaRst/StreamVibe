const { Router } = require('express');

const { getPlans, createSubscriptionCheckout, verifySubscriptionCheckout } = require('../controller/subscriptionController');
const Authenticate = require('../middleware/Authenticate');

const router = Router();

//! the pricing page is public — it is what someone reads before signing up
router.get('/plans', getPlans);

//! everything that moves money is tied to the signed-in user
router.post('/checkout', Authenticate, createSubscriptionCheckout);
router.post('/verify', Authenticate, verifySubscriptionCheckout);

module.exports = router;
