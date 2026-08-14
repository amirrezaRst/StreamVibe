"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import { startSubscriptionCheckout } from "@/services/SubscriptionService";

/**
 * The confirm step before checkout.
 *
 * This used to promise a payment page and then just switch the plan on for
 * free. It now does what it always said it did: opens a Stripe Checkout
 * session and hands the browser over to it. The plan is only activated once
 * that session comes back paid — on the return page, or by the webhook if the
 * tab never makes it back.
 */
const SubscriptionModalContent = ({ plan, time, price, setIsOpen }) => {
    const [starting, setStarting] = useState(false);

    const cycleLabel = time === "month" ? "1 Month" : "1 Year";

    const handlePlan = async () => {
        setStarting(true);
        try {
            const { url } = await startSubscriptionCheckout(plan, time);
            if (!url) throw new Error("The payment page didn't open. Please try again.");

            //! a full navigation, not a router push — the next page is Stripe's,
            //! not one of ours
            window.location.href = url;
        } catch (error) {
            toast.error(error.message);
            setStarting(false);
            setIsOpen(false);
        }
    };

    return (
        <>
            <span className="block text-center text-xl font-bold text-white">
                Start <span className="capitalize">{plan}</span> Plan — {cycleLabel}
            </span>
            <p className="text-center text-c-grey-65 mt-4 text-super-sm tracking-wide">
                {price
                    ? <>You&apos;ll be charged <span className="text-white font-semibold">${price}</span> for {cycleLabel.toLowerCase()}.<br /></>
                    : null}
                Continue to our payment provider to finish checking out.
            </p>

            <div className="flex justify-center gap-3.5 mt-9 text-white 3xl:text-lg text-super-sm">
                <button
                    className="bg-c-red-45 hover:bg-c-red-45/85 disabled:opacity-50 py-2 px-9 rounded duration-150"
                    onClick={handlePlan}
                    disabled={starting}
                >
                    {starting ? "Opening…" : "Continue to payment"}
                </button>
            </div>
        </>
    );
}

export default SubscriptionModalContent;
