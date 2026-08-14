const userModel = require('../model/userModel');
const { PLANS, BILLING_CYCLES, CURRENCY, priceFor } = require('../constants/plans');
const { stripe, isConfigured, toMinorUnits, fromMinorUnits } = require('../utils/stripe');

const frontAddress = () => (process.env.FRONT_ADDRESS || '').replace(/\/$/, '');

const notConfigured = (res) => res.status(503).json({
    status: 503,
    message: "Payments aren't set up on this server yet.",
});

/**
 * Turning a paid plan on, for real.
 *
 * Before this existed, POST /user/addSubscription switched any plan on for
 * anybody who asked — the modal said "Pay Now" and "you will be redirected to
 * the payment page", and neither was true. The price was a frontend constant,
 * so even a well-behaved client was only ever telling the server what it felt
 * like paying.
 *
 * So: the browser names a plan and a billing cycle, nothing else. What that
 * costs is read from constants/plans.js here, the charge is a Stripe Checkout
 * session, and the plan only becomes active once Stripe says that session was
 * paid. The free trial is untouched — it is genuinely free, and already
 * refuses to be claimed twice.
 */

//! a session id only ever reaches us via the browser, so on its own it proves
//! nothing — this is what ties one to the user it claims to be for
const belongsToUser = (session, userId) =>
    session.metadata && session.metadata.userId === String(userId);

const publicPlans = () => Object.entries(PLANS).map(([id, plan]) => ({
    id,
    label: plan.label,
    maxQuality: plan.maxQuality,
    canDownload: plan.canDownload,
    price: plan.price,
}));

/**
 * The prices the pricing page renders, from the same constant the charge is
 * built from — so what someone is shown and what they are billed cannot drift
 * apart the way they did when the frontend kept its own copy.
 */
exports.getPlans = (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Plans fetched successfully",
        currency: CURRENCY,
        cycles: BILLING_CYCLES,
        plans: publicPlans(),
    });
};

/**
 * Writes the paid plan onto the user, once.
 *
 * Conditioning the update on this session not already being recorded is what
 * makes it safe to run twice: whichever of the browser return and the webhook
 * gets there first does the work, and the other reads back the same result
 * instead of extending the subscription a second time.
 */
const activatePaidPlan = async (userId, session) => {
    const { plan, cycle } = session.metadata || {};
    const days = BILLING_CYCLES[cycle] ? BILLING_CYCLES[cycle].days : null;

    if (!PLANS[plan] || !days) {
        //! a session whose metadata we no longer understand must not silently
        //! grant something arbitrary
        return { outcome: 'unknown_plan' };
    }

    const alreadyDone = await userModel.findOne({
        _id: userId,
        'subscription.payment.sessionId': session.id,
    }).select('subscription');

    if (alreadyDone) return { outcome: 'active', subscription: alreadyDone.subscription };

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const intentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent && session.payment_intent.id;

    const updated = await userModel.findOneAndUpdate(
        { _id: userId, 'subscription.payment.sessionId': { $ne: session.id } },
        {
            $set: {
                subscription: {
                    status: 'active',
                    startDate,
                    endDate,
                    plan,
                    billingCycle: cycle,
                    source: 'checkout',
                    payment: {
                        sessionId: session.id,
                        intentId: intentId || null,
                        amount: fromMinorUnits(session.amount_total),
                        currency: session.currency || CURRENCY,
                        paidAt: new Date(),
                    },
                },
            },
        },
        { new: true }
    ).select('subscription');

    if (!updated) {
        //! lost the race — read back whatever the winner wrote
        const current = await userModel.findById(userId).select('subscription');
        return { outcome: 'active', subscription: current && current.subscription };
    }

    return { outcome: 'active', subscription: updated.subscription };
};

exports.activatePaidPlan = activatePaidPlan;


//! Post Request
exports.createSubscriptionCheckout = async (req, res) => {
    if (!isConfigured()) return notConfigured(res);

    const { plan, cycle } = req.body;

    //! the two things the browser is allowed to choose, both checked against
    //! what the server actually offers before either reaches a price
    if (!PLANS[plan]) {
        return res.status(400).json({ status: 400, message: "That isn't a plan we offer" });
    }
    if (!BILLING_CYCLES[cycle]) {
        return res.status(400).json({ status: 400, message: "Pick a monthly or yearly plan" });
    }

    try {
        const user = await userModel.findById(req.user.id).select('email subscription');
        if (!user) return res.status(404).json({ status: 404, message: "User not found" });

        //! paying again while a plan is still running would take money for
        //! time the account already has
        if (user.subscription && user.subscription.status === 'active'
            && user.subscription.endDate && new Date(user.subscription.endDate) > new Date()) {
            return res.status(409).json({ status: 409, message: "This account already has an active plan" });
        }

        const amount = priceFor(plan, cycle);
        const { label } = PLANS[plan];
        const cycleLabel = BILLING_CYCLES[cycle].label;

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            client_reference_id: String(user._id),
            customer_email: user.email,
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: CURRENCY,
                    unit_amount: toMinorUnits(amount),
                    product_data: {
                        name: `StreamVibe ${label} — ${cycleLabel}`,
                        description: `${BILLING_CYCLES[cycle].days} days of ${label}, up to ${PLANS[plan].maxQuality}.`,
                    },
                },
            }],
            //! the only place the plan being bought is recorded — read back
            //! from the session on the way in, never trusted from the browser
            metadata: {
                userId: String(user._id),
                plan,
                cycle,
            },
            success_url: `${frontAddress()}/subscriptions/return?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontAddress()}/subscriptions?payment=cancelled`,
        });

        res.status(201).json({ status: 201, url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('[subscription] checkout session failed:', error.message);
        res.status(500).json({ status: 500, message: "Couldn't start the payment. Please try again." });
    }
};

exports.verifySubscriptionCheckout = async (req, res) => {
    if (!isConfigured()) return notConfigured(res);

    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ status: 400, message: "Missing payment session" });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!belongsToUser(session, req.user.id)) {
            return res.status(403).json({ status: 403, message: "That payment doesn't belong to this account" });
        }
        if (session.payment_status !== 'paid') {
            return res.status(402).json({ status: 402, outcome: 'unpaid', message: "That payment didn't go through" });
        }

        const result = await activatePaidPlan(req.user.id, session);

        if (result.outcome === 'unknown_plan') {
            return res.status(409).json({ status: 409, message: "That payment is for a plan we no longer offer" });
        }

        res.status(200).json({
            status: 200,
            outcome: result.outcome,
            message: "Subscription activated",
            subscription: result.subscription,
        });
    } catch (error) {
        console.error('[subscription] verify failed:', error.message);
        res.status(500).json({ status: 500, message: "Couldn't confirm the payment. Please try again." });
    }
};
