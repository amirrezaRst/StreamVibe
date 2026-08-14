const Booking = require('../model/bookingModel');
const BookedSeat = require('../model/bookedSeatModel');
const BOOKING_POPULATE = require('../utils/bookingPopulate');
const { stripe, isConfigured, toMinorUnits, fromMinorUnits } = require('../utils/stripe');
const { activatePaidPlan } = require('./subscriptionController');

const frontAddress = () => (process.env.FRONT_ADDRESS || '').replace(/\/$/, '');

const notConfigured = (res) => res.status(503).json({
    status: 503,
    message: "Payments aren't set up on this server yet.",
});

//! a session id is only ever handed back by the browser, so it proves nothing
//! on its own — this is what ties one to the booking it claims to be for
const belongsToBooking = (session, booking) =>
    session.metadata && session.metadata.bookingId === String(booking._id);

//! One line per seat tier rather than one for the whole booking: the receipt
//! Stripe emails then reads the way the seat picker looked.
const buildLineItems = (booking, showtime) => {
    const byTier = new Map();

    booking.seats.forEach(seat => {
        const entry = byTier.get(seat.tier);
        if (entry) {
            entry.labels.push(seat.label);
        } else {
            byTier.set(seat.tier, { price: seat.price, labels: [seat.label] });
        }
    });

    const title = showtime && showtime.movie ? showtime.movie.title : 'Cinema ticket';
    const venue = showtime && showtime.cinema ? showtime.cinema.name : null;

    return [...byTier].map(([tier, { price, labels }]) => ({
        quantity: labels.length,
        price_data: {
            currency: booking.currency.toLowerCase(),
            unit_amount: toMinorUnits(price),
            product_data: {
                name: `${title} — ${tier} seat${labels.length > 1 ? 's' : ''}`,
                description: [venue, labels.join(', ')].filter(Boolean).join(' · '),
            },
        },
    }));
};


//! Money already taken for seats we can no longer honour goes straight back.
//! Doing it here, unprompted, is the whole reason this branch exists: the
//! alternative is a user holding a charge and no ticket.
const refundAndRelease = async (booking, intentId, amount, reason) => {
    let refunded = false;

    try {
        if (intentId) {
            await stripe.refunds.create({ payment_intent: intentId });
            refunded = true;
        }
    } catch (error) {
        //! never swallowed: a failed refund is real money the user is owed, and
        //! the booking below records that it is still outstanding
        console.error(`[payment] refund failed for ${booking.bookingCode}:`, error.message);
    }

    await BookedSeat.deleteMany({ booking: booking._id });

    const updated = await Booking.findByIdAndUpdate(
        booking._id,
        {
            $set: {
                status: 'expired',
                expiresAt: null,
                'payment.status': refunded ? 'refunded' : 'paid',
                'payment.intentId': intentId,
                'payment.amount': amount,
                //! the money genuinely was taken before it went back — without
                //! this the ledger shows a refund with no charge behind it, and
                //! the two columns stop adding up
                'payment.paidAt': booking.payment.paidAt || new Date(),
                'payment.refundedAt': refunded ? new Date() : null,
                'payment.refundReason': reason,
            },
        },
        { new: true }
    ).populate(BOOKING_POPULATE);

    return { outcome: refunded ? 'refunded' : 'refund_failed', booking: updated, reason };
};

/**
 * The browser returning and the webhook arriving both mean the same thing —
 * Stripe considers this session paid — and either can land first, or twice, or
 * only one of them at all. So this has to be safe to run repeatedly and must
 * never depend on which path called it.
 */
const settlePaidSession = async (booking, session) => {
    if (booking.status === 'confirmed') {
        return { outcome: 'confirmed', booking };
    }

    const amount = fromMinorUnits(session.amount_total);
    const intentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent && session.payment_intent.id;

    if (booking.status === 'cancelled') {
        return refundAndRelease(booking, intentId, amount, "the booking was cancelled before the payment settled");
    }

    const heldSeats = await BookedSeat.countDocuments({ booking: booking._id });
    if (booking.isExpired || heldSeats !== booking.seats.length) {
        return refundAndRelease(booking, intentId, amount, "the hold ran out before the payment completed");
    }

    //! conditioning on 'pending' is what makes two simultaneous settlements
    //! resolve to one: the loser gets null back and reads the winner's result
    const claimed = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'pending' },
        {
            $set: {
                status: 'confirmed',
                confirmedAt: new Date(),
                expiresAt: null,
                'payment.status': 'paid',
                'payment.sessionId': session.id,
                'payment.intentId': intentId,
                'payment.amount': amount,
                'payment.paidAt': new Date(),
            },
        },
        { new: true }
    ).populate(BOOKING_POPULATE);

    if (!claimed) {
        const current = await Booking.findById(booking._id).populate(BOOKING_POPULATE);
        return { outcome: current ? current.status : 'unknown', booking: current };
    }

    //! clearing expiresAt takes the seats out of the TTL monitor's reach
    await BookedSeat.updateMany({ booking: booking._id }, { $set: { expiresAt: null } });

    //! the monitor could have swept one between the count above and the clear
    //! just now, in which case this booking cannot be honoured after all
    const survived = await BookedSeat.countDocuments({ booking: booking._id });
    if (survived !== booking.seats.length) {
        return refundAndRelease(claimed, intentId, amount, "seats were released before the payment settled");
    }

    return { outcome: 'confirmed', booking: claimed };
};


/**
 * A user who closed the tab on the way back from the gateway never triggers
 * /verify, and until a webhook is wired up nothing else tells us they paid —
 * their hold would quietly lapse on a seat they had already been charged for.
 * So whenever they come back to look at a booking, ask the gateway what became
 * of its session and settle it then.
 *
 * Cheap in practice: only a pending booking that has actually reached the
 * gateway is ever asked about, and a booking is only pending for minutes.
 */
exports.reconcilePendingPayment = async (booking) => {
    if (!isConfigured() || !booking) return booking;
    if (booking.status !== 'pending' || !booking.payment.sessionId) return booking;

    try {
        const session = await stripe.checkout.sessions.retrieve(booking.payment.sessionId);
        if (session.payment_status !== 'paid') return booking;

        const result = await settlePaidSession(booking, session);
        return result.booking || booking;
    } catch (error) {
        //! never fatal — this runs behind a plain read, and a gateway that is
        //! briefly unreachable must not stop someone seeing their booking
        console.error(`[payment] could not reconcile ${booking.bookingCode}:`, error.message);
        return booking;
    }
};


//! Post Request
exports.createCheckoutSession = async (req, res) => {
    if (!isConfigured()) return notConfigured(res);

    try {
        const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);
        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        if (String(booking.user) !== req.user.id) {
            return res.status(403).json({ status: 403, message: "You can only pay for your own booking" });
        }
        if (booking.status === 'confirmed') {
            return res.status(409).json({ status: 409, message: "This booking is already paid for" });
        }
        if (booking.status !== 'pending' || booking.isExpired) {
            return res.status(409).json({ status: 409, message: "Your hold expired — the seats were released" });
        }

        //! pressing Pay twice must not open a second chargeable page, so an
        //! session that is still open is handed back rather than replaced
        if (booking.payment.sessionId) {
            try {
                const existing = await stripe.checkout.sessions.retrieve(booking.payment.sessionId);
                if (existing.status === 'open' && existing.url) {
                    return res.status(200).json({ status: 200, url: existing.url, sessionId: existing.id, reused: true });
                }
            } catch (error) {
                //! a session Stripe no longer knows about is simply replaced
                console.error(`[payment] could not reuse session ${booking.payment.sessionId}:`, error.message);
            }
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            client_reference_id: String(booking._id),
            customer_email: req.user.email,
            line_items: buildLineItems(booking, booking.showtime),
            metadata: {
                bookingId: String(booking._id),
                bookingCode: booking.bookingCode,
            },
            success_url: `${frontAddress()}/booking/${booking._id}/return?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontAddress()}/booking/${booking._id}?payment=cancelled`,
        });

        booking.payment.sessionId = session.id;
        booking.payment.amount = booking.totalPrice;
        await booking.save();

        res.status(201).json({ status: 201, url: session.url, sessionId: session.id, reused: false });
    } catch (error) {
        console.error('[payment] checkout session failed:', error.message);
        res.status(500).json({ status: 500, message: "Couldn't start the payment. Please try again." });
    }
};

exports.verifyCheckout = async (req, res) => {
    if (!isConfigured()) return notConfigured(res);

    try {
        const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);
        if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

        if (String(booking.user) !== req.user.id) {
            return res.status(403).json({ status: 403, message: "You can only verify your own booking" });
        }

        //! the webhook may already have settled this while the browser was
        //! still redirecting, which is a success, not a conflict
        if (booking.status === 'confirmed') {
            return res.status(200).json({ status: 200, outcome: 'confirmed', message: "Payment confirmed", booking });
        }

        const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);

        if (!belongsToBooking(session, booking)) {
            return res.status(400).json({ status: 400, message: "That payment doesn't belong to this booking" });
        }
        if (session.payment_status !== 'paid') {
            return res.status(402).json({ status: 402, outcome: 'unpaid', message: "That payment didn't go through" });
        }

        const result = await settlePaidSession(booking, session);

        res.status(200).json({
            status: 200,
            outcome: result.outcome,
            reason: result.reason || null,
            message: result.outcome === 'confirmed' ? "Payment confirmed" : "Payment received but the seats were gone",
            booking: result.booking,
        });
    } catch (error) {
        console.error('[payment] verify failed:', error.message);
        res.status(500).json({ status: 500, message: "Couldn't confirm the payment. Please try again." });
    }
};

/**
 * Stripe's own report of what happened, and the only path that still works if
 * the user closes the tab on the way back. Signed, so it can be trusted
 * without a session of its own.
 */
exports.handleWebhook = async (req, res) => {
    if (!isConfigured()) return notConfigured(res);

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        //! an unverifiable body is somebody else's traffic, not ours
        return res.status(400).json({ status: 400, message: `Webhook signature check failed: ${error.message}` });
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};

            if (session.payment_status === 'paid') {
                //! one webhook, two kinds of purchase — a seat booking and a
                //! subscription are told apart by which id their session was
                //! stamped with, since both arrive on this same event
                if (metadata.bookingId) {
                    const booking = await Booking.findById(metadata.bookingId);
                    if (booking) await settlePaidSession(booking, session);
                } else if (metadata.userId && metadata.plan) {
                    await activatePaidPlan(metadata.userId, session);
                }
            }
        }
    } catch (error) {
        //! a 500 here makes Stripe retry, which is what we want if our own side
        //! broke — but the error still has to be visible
        console.error(`[payment] webhook ${event.type} failed:`, error.message);
        return res.status(500).json({ status: 500, message: "Webhook handling failed" });
    }

    res.status(200).json({ received: true });
};
