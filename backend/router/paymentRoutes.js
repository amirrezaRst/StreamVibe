const { Router } = require('express');
const { handleWebhook } = require('../controller/paymentController');

const router = Router();

//! No Authenticate here on purpose: Stripe calls this, not a browser. What
//! makes it trustworthy is the signature over the raw body, checked inside the
//! handler — see the rawBody capture in server.js.
router.post("/webhook", handleWebhook);

module.exports = router;
