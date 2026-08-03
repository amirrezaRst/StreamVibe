const Stripe = require('stripe');

//! STRIPE_API_HOST points the SDK at a local stand-in instead of Stripe's
//! servers. It exists so the payment flow can be built and exercised before
//! anyone has an account; unset, everything below talks to the real test-mode
//! API and none of this code changes.
const buildOptions = () => {
    const host = process.env.STRIPE_API_HOST;
    if (!host) return {};

    const [hostname, port] = host.split(':');
    return {
        host: hostname,
        port: port ? Number(port) : 80,
        protocol: 'http',
    };
};

//! a missing key must not take the whole server down at require time — every
//! other route still works, and the payment routes say so plainly
const key = process.env.STRIPE_SECRET_KEY;

exports.stripe = key ? new Stripe(key, buildOptions()) : null;

exports.isConfigured = () => Boolean(key);

//! Stripe deals in the smallest currency unit, so $48.00 travels as 4800.
//! Rounding here rather than at the call sites keeps float drift out of the
//! amount that actually gets charged.
exports.toMinorUnits = (amount) => Math.round(amount * 100);

exports.fromMinorUnits = (amount) => amount / 100;
