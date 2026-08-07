"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import Ticket from "@/components/booking/Ticket";
import HoldTimer from "@/components/booking/HoldTimer";
import PaymentNotice from "@/components/booking/PaymentNotice";
import { cancelBooking, createCheckout, fetchBooking } from "@/services/BookingService";

const CardIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
    </svg>
);

const BookingDetail = ({ id }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchBooking(id);
            setBooking(data.booking);
        } catch (error) {
            toast.error(error.message);
            if (error.status === 403 || error.status === 404) router.push("/");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { load(); }, [load]);

    //! coming back from the gateway's own back button; the hold is untouched,
    //! so this is information rather than an error
    const announcedCancel = useRef(false);
    useEffect(() => {
        if (searchParams.get("payment") !== "cancelled" || announcedCancel.current) return;

        announcedCancel.current = true;
        toast.info("Payment cancelled — your seats are still held.");
        router.replace(`/booking/${id}`, { scroll: false });
    }, [searchParams, router, id]);

    const handlePay = async () => {
        setWorking(true);
        try {
            const { url } = await createCheckout(id);
            //! a full navigation, not router.push: the gateway is not our app
            window.location.href = url;
        } catch (error) {
            toast.error(error.message);
            setWorking(false);
            load(); //! most likely the hold lapsed; re-read the real state
        }
    };

    const handleCancel = async () => {
        setWorking(true);
        try {
            const data = await cancelBooking(id);
            setBooking(data.booking);
            toast.success("Booking cancelled and seats released.");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setWorking(false);
        }
    };

    if (loading) {
        return (
            <main className="container py-16 text-center text-c-grey-60 text-super-sm">
                Loading your booking…
            </main>
        );
    }

    if (!booking) return null;

    const isPending = booking.status === "pending" && !booking.isExpired;
    const wasRefunded = booking.payment && booking.payment.status === "refunded";

    const subtitle = () => {
        if (booking.status === "confirmed") return "Show this code at the cinema entrance.";
        if (isPending) return "Your seats are held. Pay to lock them in.";
        if (wasRefunded) return "The hold ran out while you were paying, so we refunded you.";
        return "This booking is no longer active.";
    };

    return (
        <main className="container py-12 flex flex-col items-center gap-7">
            <div className="text-center">
                <h1 className="text-2xl font-extrabold text-white mb-1.5">
                    {booking.status === "confirmed" ? "Your ticket" : "Almost there"}
                </h1>
                <p className="text-c-grey-60 text-super-sm">{subtitle()}</p>
            </div>

            <Ticket booking={booking} />

            {isPending && (
                <div className="w-full max-w-[400px]">
                    <HoldTimer expiresAt={booking.expiresAt} onExpire={load} />

                    <div className="mt-4">
                        <PaymentNotice />

                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={working}
                            className="w-full bg-c-red-45 text-white rounded-full py-3 px-6 text-[14.5px] font-extrabold
                                       flex items-center justify-center gap-2.5
                                       shadow-[0_8px_20px_-10px_rgba(229,0,0,0.9)] hover:bg-[#c40000] active:scale-[0.98]
                                       disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                        >
                            {working ? "Opening the gateway…" : <><CardIcon /> Pay ${booking.totalPrice.toFixed(2)}</>}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={working}
                            className="w-full mt-2.5 rounded-full py-2.5 px-6 text-[13.5px] font-bold text-c-grey-70
                                       border border-c-black-20 hover:border-c-black-30 hover:text-white
                                       disabled:opacity-60 transition-colors"
                        >
                            Release seats
                        </button>

                        <p className="mt-3 text-center text-[11px] text-c-grey-55">
                            Secured by <span className="text-[#8F88FF] font-bold">Stripe</span>
                        </p>
                    </div>
                </div>
            )}

            {wasRefunded && (
                <div className="w-full max-w-[400px] bg-c-black-10 border border-c-black-15 border-s-[2.5px] border-s-[#3DA872] rounded-[10px] py-3 px-3.5">
                    <p className="text-[12.5px] font-bold text-[#6FCB9C] mb-0.5">
                        ${booking.payment.amount.toFixed(2)} refunded
                    </p>
                    <p className="text-xs text-c-grey-60 leading-relaxed">
                        Back on the card within a few days. Nothing to do — pick new seats whenever you are ready.
                    </p>
                </div>
            )}

            {booking.status === "confirmed" && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={working}
                    className="text-c-grey-60 text-super-sm hover:text-c-red-60 underline underline-offset-4 disabled:opacity-60 transition-colors"
                >
                    Cancel this booking
                </button>
            )}

            <div className="w-full max-w-[400px] pt-1 border-t border-c-black-15 text-center">
                <Link href="/movies" className="inline-block mt-6 text-c-grey-60 text-super-sm hover:text-white transition-colors">
                    ← Back to movies
                </Link>
            </div>
        </main>
    );
};

export default BookingDetail;
