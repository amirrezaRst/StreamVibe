"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { fetchBooking, refundBooking } from "@/services/AdminService";
import { seatLabel, tierOf } from "./seatTiers";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const when = (iso) => new Date(iso).toLocaleString("en-US", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
});

const Row = ({ label, children }) => (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-c-black-15 last:border-b-0 text-[12.5px]">
        <span className="text-c-grey-55 shrink-0">{label}</span>
        <span className="text-c-grey-90 font-bold text-end break-all">{children}</span>
    </div>
);

/**
 * The room drawn around the booking. "F7, F8" is a label; where those seats are
 * is the question somebody on the phone is actually asking.
 */
const TheirSeats = ({ seatMap, seats }) => {
    const theirs = new Set(seats.map(seat => seat.label));

    //! only the rows they are in, plus one either side — a 40-row hall drawn in
    //! full would bury the two seats this is about
    const rowIndexes = seatMap
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.seats.some(seat => theirs.has(seatLabel(row.row, seat.number))))
        .map(({ index }) => index);

    if (!rowIndexes.length) return null;

    const from = Math.max(Math.min(...rowIndexes) - 1, 0);
    const to = Math.min(Math.max(...rowIndexes) + 1, seatMap.length - 1);
    const visible = seatMap.slice(from, to + 1);

    return (
        <div className="bg-c-black-06 border border-c-black-15 rounded-[9px] py-3.5 px-2.5">
            <div className="h-[4px] mx-auto mb-1 rounded-full w-1/2 bg-gradient-to-r from-transparent via-c-black-25 to-transparent" />
            <p className="text-center text-[9px] font-extrabold tracking-[0.22em] uppercase text-c-grey-55 mb-3">Screen</p>

            <div className="flex flex-col gap-1 items-center w-max mx-auto">
                {visible.map(row => (
                    <div key={row.row} className="flex items-center gap-1">
                        <span className="w-3.5 text-center text-[9px] text-c-grey-55 font-extrabold shrink-0">{row.row}</span>
                        {row.seats.map((seat, i) => {
                            const label = seatLabel(row.row, seat.number);
                            const mine = theirs.has(label);
                            const tier = tierOf(seat.tier);

                            return (
                                <span
                                    key={i}
                                    title={label}
                                    className={`block w-[13px] h-3 rounded-t-[2px] rounded-b-[1px] border shrink-0
                                        ${mine ? "outline outline-2 outline-c-red-45 outline-offset-1" : ""}`}
                                    style={{
                                        background: seat.disabled ? "transparent" : tier.fill,
                                        borderColor: seat.disabled ? "#333333" : tier.border,
                                        borderStyle: seat.disabled ? "dashed" : "solid",
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <p className="text-center text-[10.5px] text-c-grey-55 mt-3">
                {seats.map(seat => seat.label).join(", ")} · {seats[0]?.tier} · {money(seats[0]?.price)} each
            </p>
        </div>
    );
};

const BookingDrawer = ({ bookingId, onClose, onChanged }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        fetchBooking(bookingId).then(setData).catch(err => setError(err.message));
    }, [bookingId]);

    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const booking = data?.booking;
    const refundable = booking?.payment?.status === "paid";

    const refund = async () => {
        const reason = window.prompt(`Refund ${money(booking.payment.amount)} to ${booking.user?.email}?\n\nWhy? (optional, kept on the booking)`);
        if (reason === null) return;

        setBusy(true);
        try {
            const result = await refundBooking(bookingId, reason || undefined);
            toast.success(result.message);
            onChanged();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-c-black-06/60 flex justify-end z-50" onClick={onClose}>
            <div
                className="w-full max-w-[440px] bg-c-black-10 border-s border-c-black-20 flex flex-col h-full"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center gap-2.5 py-3 px-4 border-b border-c-black-15">
                    <h2 className="text-[14.5px] font-extrabold font-mono">
                        {booking?.bookingCode || "Booking"}
                    </h2>
                    {booking && (
                        <span className={`text-[10.5px] font-extrabold py-0.5 px-2 rounded-full capitalize
                            ${booking.status === "confirmed" ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]"
                                : booking.status === "cancelled" ? "bg-[#E5477A]/[0.14] text-[#E5477A]"
                                    : "bg-c-black-15 text-c-grey-60"}`}>
                            {booking.status}
                        </span>
                    )}
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="ms-auto text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}
                    {!data && !error && <div className="h-64 rounded-lg bg-c-black-12 animate-pulse" />}

                    {booking && (
                        <>
                            <Row label="Customer">{booking.user?.email || "—"}</Row>
                            <Row label="Film"><span className="capitalize">{booking.showtime?.movie?.title || "—"}</span></Row>
                            <Row label="Screening">
                                {booking.showtime?.hall?.name} · {booking.showtime?.startsAt ? when(booking.showtime.startsAt) : "—"}
                            </Row>
                            <Row label="Venue">{booking.showtime?.cinema?.name} · {booking.showtime?.cinema?.city}</Row>
                            <Row label="Total">{money(booking.totalPrice)}</Row>
                            <Row label="Payment">
                                <span className="capitalize">{booking.payment?.status || "unpaid"}</span>
                                {booking.payment?.paidAt && ` · ${when(booking.payment.paidAt)}`}
                            </Row>
                            {booking.payment?.intentId && (
                                <Row label="Gateway">
                                    <span className="font-mono text-[10.5px]">{booking.payment.intentId}</span>
                                </Row>
                            )}
                            {booking.payment?.refundReason && (
                                <Row label="Refund reason">{booking.payment.refundReason}</Row>
                            )}

                            {data.seatMap && (
                                <>
                                    <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-grey-55 mt-4 mb-2">
                                        Their seats
                                    </h3>
                                    <TheirSeats seatMap={data.seatMap} seats={booking.seats} />
                                </>
                            )}

                            {refundable && (
                                <div className="flex gap-2 items-start bg-[#D99A34]/[0.14] border border-[#D99A34]/30
                                    rounded-lg py-2.5 px-3 mt-4 text-[11.5px] leading-relaxed text-[#E8B663]">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" className="shrink-0 mt-px">
                                        <path d="M12 9v4M12 17h.01" />
                                        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                                    </svg>
                                    <span>
                                        Refunding goes through the gateway and releases {booking.seats.length === 1 ? "the seat" : "all the seats"} back
                                        to the screening. It cannot be undone.
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                    {refundable && (
                        <button type="button" onClick={refund} disabled={busy}
                            className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-red-45/35
                                text-c-red-80 hover:bg-c-red-45/[0.12] duration-150 disabled:opacity-40">
                            {busy ? "Refunding…" : `Refund ${money(booking.payment.amount)}`}
                        </button>
                    )}
                    <button type="button" onClick={onClose}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-black-20
                            bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default BookingDrawer;
