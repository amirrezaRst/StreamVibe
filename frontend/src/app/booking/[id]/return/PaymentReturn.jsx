"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import { verifyCheckout } from "@/services/BookingService";

const ClockIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
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
            ${tone === "warn" ? "bg-[#D99A34]/[0.14] text-[#E8B663]" : "bg-c-red-45/[0.12] text-c-red-60"}`}>
            {icon}
        </div>
        <div>
            <h1 className="text-xl font-extrabold text-white mb-1.5">{title}</h1>
            <p className="text-c-grey-60 text-super-sm max-w-[42ch]">{description}</p>
        </div>
        {children}
    </main>
);

/**
 * Where the gateway drops the user back. Nothing here decides whether the
 * payment happened — it hands the session id to the server, which asks the
 * gateway directly. A confirmed booking is sent straight on to its ticket.
 */
const PaymentReturn = ({ id }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

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

        verifyCheckout(id, sessionId)
            .then(({ outcome, booking }) => {
                if (outcome === "confirmed") {
                    toast.success("Payment confirmed — enjoy the film!");
                    router.replace(`/booking/${id}`);
                    return;
                }
                setState({ status: outcome, amount: booking && booking.payment && booking.payment.amount });
            })
            .catch(error => setState({ status: "failed", message: error.message }));
    }, [id, sessionId, router]);

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

    if (state.status === "refunded" || state.status === "refund_failed") {
        const refunded = state.status === "refunded";

        return (
            <Outcome
                tone="warn"
                icon={<ClockIcon />}
                title="Your hold ran out"
                description={refunded
                    ? "The seats were released while you were paying, so we refunded you straight away."
                    : "The seats were released while you were paying. The refund didn't go through — our team will sort it out."}
            >
                {refunded && state.amount != null && (
                    <div className="w-full max-w-[400px] bg-c-black-10 border border-c-black-15 border-s-[2.5px] border-s-[#3DA872] rounded-[10px] py-3 px-3.5 text-start">
                        <p className="text-[12.5px] font-bold text-[#6FCB9C] mb-0.5">${state.amount.toFixed(2)} refunded</p>
                        <p className="text-xs text-c-grey-60 leading-relaxed">
                            Back on the card within a few days. Nothing to do — pick new seats whenever you are ready.
                        </p>
                    </div>
                )}
                <Link
                    href="/movies"
                    className="bg-c-red-45 hover:bg-[#c40000] text-white rounded-full py-3 px-8 text-[14.5px] font-extrabold transition-colors"
                >
                    Pick seats again
                </Link>
                {!refunded && (
                    <Link href="/support" className="text-c-grey-60 text-super-sm hover:text-white underline underline-offset-4">
                        Contact support
                    </Link>
                )}
            </Outcome>
        );
    }

    return (
        <Outcome
            tone="bad"
            icon={<AlertIcon />}
            title="That payment didn't go through"
            description={state.message || "Nothing was charged. Your seats are still held if the timer hasn't run out."}
        >
            <Link
                href={`/booking/${id}`}
                className="bg-c-red-45 hover:bg-[#c40000] text-white rounded-full py-3 px-8 text-[14.5px] font-extrabold transition-colors"
            >
                Back to your booking
            </Link>
        </Outcome>
    );
};

export default PaymentReturn;
