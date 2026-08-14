"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { verifySubscriptionPayment } from "@/services/SubscriptionService";
import useUserStore from "@/stores/useUserStore";

const CheckIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AlertIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" />
    </svg>
);

const Outcome = ({ tone, icon, title, description, children }) => (
    <main className="container py-16 flex flex-col items-center gap-5 text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center
            ${tone === "good" ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]" : "bg-c-red-45/[0.12] text-c-red-60"}`}>
            {icon}
        </div>
        <div>
            <h1 className="text-xl font-extrabold text-white mb-1.5">{title}</h1>
            <p className="text-c-grey-60 text-super-sm max-w-[42ch]">{description}</p>
        </div>
        {children}
    </main>
);

const formatDate = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

/**
 * Where checkout drops the user back.
 *
 * Nothing here decides whether the payment happened — it hands the session id
 * to the server, which asks Stripe directly. The webhook may well have
 * activated the plan already; verifying again is harmless, since activation is
 * keyed on the session id and only runs once.
 */
const SubscriptionReturn = () => {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const fetchUser = useUserStore((state) => state.fetchUser);

    const [state, setState] = useState({ status: "verifying" });

    //! React runs effects twice in development; without this the second pass
    //! fires a duplicate verify while the first is still in flight
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (!sessionId) {
            setState({ status: "failed", message: "We couldn't tell which payment this was." });
            return;
        }

        verifySubscriptionPayment(sessionId)
            .then(async ({ subscription }) => {
                //! the navbar and every paywall read the plan off the store, so
                //! it has to be refreshed before this page hands control back
                await fetchUser();
                setState({ status: "active", subscription });
            })
            .catch(error => setState({ status: "failed", message: error.message }));
    }, [sessionId, fetchUser]);

    if (state.status === "verifying") {
        return (
            <main className="container py-24 flex flex-col items-center gap-6 text-center">
                <div className="w-11 h-11 rounded-full border-[3px] border-c-black-20 border-t-c-red-45 animate-spin" />
                <div>
                    <h1 className="text-xl font-extrabold text-white mb-1.5">Confirming your payment</h1>
                    <p className="text-c-grey-60 text-super-sm">This takes a second — please don&apos;t close the tab.</p>
                </div>
            </main>
        );
    }

    if (state.status === "active") {
        const { plan, endDate, payment } = state.subscription || {};

        return (
            <Outcome
                tone="good"
                icon={<CheckIcon />}
                title="You're all set"
                description={`Your ${plan || ""} plan is active. Everything in the catalogue is open to you now.`}
            >
                {(payment?.amount != null || endDate) && (
                    <div className="w-full max-w-[400px] bg-c-black-10 border border-c-black-15 border-s-[2.5px] border-s-[#3DA872] rounded-[10px] py-3 px-3.5 text-start">
                        {payment?.amount != null && (
                            <p className="text-[12.5px] font-bold text-[#6FCB9C] mb-0.5">
                                ${payment.amount.toFixed(2)} paid
                            </p>
                        )}
                        {endDate && (
                            <p className="text-xs text-c-grey-60 leading-relaxed">
                                Runs until {formatDate(endDate)}.
                            </p>
                        )}
                    </div>
                )}
                <Link
                    href="/movies"
                    className="bg-c-red-45 hover:bg-[#c40000] text-white rounded-full py-3 px-8 text-[14.5px] font-extrabold transition-colors"
                >
                    Start watching
                </Link>
            </Outcome>
        );
    }

    return (
        <Outcome
            tone="bad"
            icon={<AlertIcon />}
            title="That payment didn't go through"
            description={state.message || "Nothing was charged. You can try again whenever you are ready."}
        >
            <Link
                href="/subscriptions"
                className="bg-c-red-45 hover:bg-[#c40000] text-white rounded-full py-3 px-8 text-[14.5px] font-extrabold transition-colors"
            >
                Back to plans
            </Link>
        </Outcome>
    );
};

export default SubscriptionReturn;
