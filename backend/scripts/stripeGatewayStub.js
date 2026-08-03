/**
 * A development stand-in for Stripe, so the cinema booking flow can be run and
 * demonstrated without a Stripe account. It covers only what the flow calls —
 * create and retrieve a Checkout session, create a refund — and serves a bare
 * payment page so the whole round trip is clickable.
 *
 * It is reached only when STRIPE_API_HOST is set in config.env. Leave that
 * unset and every request goes to Stripe's real test-mode API instead; not a
 * line of application code changes either way.
 *
 *   node scripts/stripeGatewayStub.js
 */
const express = require('express');

const PORT = 12111;
const app = express();
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json());

const sessions = new Map();
const refunds = [];
let counter = 0;

const id = (prefix) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const asArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : Object.keys(value).sort().map(k => value[k]);
};

app.post('/v1/checkout/sessions', (req, res) => {
    const body = req.body;
    const items = asArray(body.line_items);

    const amountTotal = items.reduce((sum, item) =>
        sum + Number(item.price_data.unit_amount) * Number(item.quantity), 0);

    const session = {
        id: id('cs_test'),
        object: 'checkout.session',
        status: 'open',
        payment_status: 'unpaid',
        amount_total: amountTotal,
        currency: items[0] ? items[0].price_data.currency : 'usd',
        payment_intent: null,
        client_reference_id: body.client_reference_id || null,
        customer_email: body.customer_email || null,
        metadata: body.metadata || {},
        success_url: body.success_url,
        cancel_url: body.cancel_url,
        line_items: items,
    };
    session.url = `http://localhost:${PORT}/pay/${session.id}`;

    sessions.set(session.id, session);
    res.json(session);
});

app.get('/v1/checkout/sessions/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
        return res.status(404).json({
            error: { type: 'invalid_request_error', message: `No such checkout.session: '${req.params.id}'` },
        });
    }
    res.json(session);
});

app.post('/v1/refunds', (req, res) => {
    const refund = {
        id: id('re_test'),
        object: 'refund',
        payment_intent: req.body.payment_intent,
        status: 'succeeded',
    };
    refunds.push(refund);
    res.json(refund);
});


//? ---- test-harness surface, not part of Stripe's API ----

const settle = (session, outcome) => {
    if (outcome === 'paid') {
        session.status = 'complete';
        session.payment_status = 'paid';
        session.payment_intent = session.payment_intent || id('pi_test');
    } else if (outcome === 'expired') {
        session.status = 'expired';
    }
    return session;
};

//! the hosted page: two buttons standing in for "card accepted" and "user
//! backed out", so a browser can walk the same path a real customer would
app.get('/pay/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).send('No such session');

    const amount = (session.amount_total / 100).toFixed(2);
    res.send(`<!doctype html><meta charset="utf-8"><title>Stripe stub — pay</title>
<body style="font-family:system-ui;background:#0A0A0A;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center">
  <h1 style="color:#8F88FF;margin:0 0 4px">stripe (stub)</h1>
  <p style="color:#999;margin:0 0 24px">StreamVibe &middot; $${amount}</p>
  <button id="pay" style="background:#635BFF;color:#fff;border:0;border-radius:7px;padding:12px 28px;font-size:15px;cursor:pointer">Pay $${amount}</button>
  <button id="decline" style="background:none;color:#999;border:1px solid #333;border-radius:7px;padding:12px 20px;margin-inline-start:8px;cursor:pointer">Card declined</button>
  <button id="cancel" style="background:none;color:#999;border:1px solid #333;border-radius:7px;padding:12px 20px;margin-inline-start:8px;cursor:pointer">Back</button>
</div>
<script>
  document.getElementById('pay').onclick = () => location.href = '/pay/${session.id}/complete';
  document.getElementById('decline').onclick = () => alert('Your card was declined.');
  document.getElementById('cancel').onclick = () => location.href = ${JSON.stringify(session.cancel_url)};
</script>
</body>`);
});

app.get('/pay/:id/complete', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).send('No such session');

    settle(session, 'paid');
    res.redirect(session.success_url.replace('{CHECKOUT_SESSION_ID}', session.id));
});

//! drive a session from a script without a browser
app.post('/__test/settle/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ message: 'No such session' });

    res.json(settle(session, req.body.outcome || 'paid'));
});

app.get('/__test/refunds', (req, res) => res.json({ refunds }));
app.post('/__test/reset', (req, res) => { sessions.clear(); refunds.length = 0; res.json({ ok: true }); });

app.listen(PORT, () => console.log(`stripe stub listening on ${PORT}`));
