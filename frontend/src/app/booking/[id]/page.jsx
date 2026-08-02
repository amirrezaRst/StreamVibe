"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import Ticket from "@/components/booking/Ticket";
import HoldTimer from "@/components/booking/HoldTimer";
import { cancelBooking, confirmBooking, fetchBooking } from "@/services/BookingService";

const BookingDetailPage = ({ params }) => {
    const router = useRouter();
    const { id } = params;

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

    const handleConfirm = async () => {
        setWorking(true);
        try {
            const data = await confirmBooking(id);
            setBooking(data.booking);
            toast.success("Booking confirmed — enjoy the film!");
        } catch (error) {
            toast.error(error.message);
            load(); //! the hold may have lapsed; re-read the real state
        } finally {
            setWorking(false);
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

    return (
        <main className="container py-8 flex flex-col items-center gap-6">
            <div className="text-center">
                <h1 className="text-2xl font-extrabold text-white mb-1">
                    {booking.status === "confirmed" ? "Your ticket" : "Almost there"}
                </h1>
                <p className="text-c-grey-60 text-super-sm">
                    {booking.status === "confirmed"
                        ? "Show this code at the cinema entrance."
                        : isPending
                            ? "Your seats are held. Confirm to lock them in."
                            : "This booking is no longer active."}
                </p>
            </div>

            <Ticket booking={booking} />

            {isPending && (
                <div className="w-full max-w-[400px]">
                    <HoldTimer expiresAt={booking.expiresAt} onExpire={load} />

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={working}
                            className="flex-1 bg-c-red-45 text-white rounded-full py-3 px-6 text-[14.5px] font-extrabold
                                       shadow-[0_8px_20px_-10px_rgba(229,0,0,0.9)] hover:bg-[#c40000] active:scale-[0.98]
                                       disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                        >
                            {working ? "Working…" : `Pay $${booking.totalPrice}`}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={working}
                            className="rounded-full py-3 px-6 text-[14.5px] font-bold text-c-grey-70 border border-c-black-20
                                       hover:border-c-black-30 hover:text-white disabled:opacity-60 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
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

            <Link href="/movies" className="text-c-grey-60 text-super-sm hover:text-white transition-colors">
                ← Back to movies
            </Link>
        </main>
    );
};

export default BookingDetailPage;
