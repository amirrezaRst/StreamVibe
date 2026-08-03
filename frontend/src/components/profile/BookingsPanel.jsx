"use client";

import Image from "next/image";
import Link from "next/link";

import { SeatGridIcon } from "@/assets/Svgs";
import { fetchMyBookings } from "@/services/BookingService";
import EmptyState from "./EmptyState";
import PanelSkeleton from "./PanelSkeleton";
import StatusPill from "./StatusPill";
import usePanelData from "./usePanelData";

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short",
});

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
});

//! money coming back is the thing the user cares about, and it outranks the
//! "expired" the booking is technically left in
const rowStatus = (booking) => {
    if (booking.payment?.status === "refunded") return "refunded";
    return booking.isExpired ? "expired" : booking.status;
};

const BookingRow = ({ booking }) => {
    const { showtime } = booking;
    const movie = showtime?.movie;

    return (
        <Link
            href={`/booking/${booking._id}`}
            className="flex items-center gap-4 max-sm:flex-wrap bg-c-black-10 border border-c-black-15 hover:border-c-black-20
                rounded-xl py-3.5 px-4 sm:px-[18px] duration-150"
        >
            <div className="w-[52px] shrink-0 aspect-thumbnail rounded-lg overflow-hidden bg-c-black-12">
                {movie?.thumbnail && (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${movie.thumbnail}`}
                        alt={movie.title}
                        width={104}
                        height={117}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold text-c-grey-90 truncate">{movie?.title || "—"}</div>
                <div className="text-[12.5px] text-c-grey-60 truncate">
                    {showtime?.cinema?.name}{showtime?.cinema?.city ? ` · ${showtime.cinema.city}` : ""}
                </div>
            </div>

            <div className="shrink-0 text-[13px] text-c-grey-65 tabular-nums max-sm:w-full max-sm:flex max-sm:justify-between
                max-sm:border-t max-sm:border-c-black-15 max-sm:pt-2.5 max-sm:mt-1
                sm:text-end sm:px-[18px] sm:border-x sm:border-c-black-15">
                <b className="sm:block text-c-grey-90 font-bold text-[13.5px]">
                    {showtime?.startsAt ? formatDate(showtime.startsAt) : "—"}
                </b>
                {showtime?.startsAt ? formatTime(showtime.startsAt) : ""}
            </div>

            <div className="shrink-0 text-end min-w-[64px]">
                <div className="text-[15px] font-extrabold text-c-grey-90 tabular-nums">
                    ${booking.totalPrice.toFixed(2)}
                </div>
                <div className="text-[11.5px] text-c-grey-60 mt-0.5">
                    {booking.seats.length} {booking.seats.length === 1 ? "seat" : "seats"}
                </div>
            </div>

            {/*//! a list mixes states, so each row has to say which one it is —
                the single-ticket page doesn't, because its heading already does */}
            <StatusPill status={rowStatus(booking)} />
        </Link>
    );
};

const BookingsPanel = () => {
    const { items, error, loading } = usePanelData(fetchMyBookings);

    if (loading) return <PanelSkeleton count={3} />;
    if (error) return <p className="text-c-grey-60 text-super-sm">{error}</p>;

    if (!items.length) {
        return (
            <EmptyState
                icon={SeatGridIcon}
                title="No cinema bookings yet"
                description="Reserve a seat for anything currently showing to see it here."
                actionLabel="Browse What's Playing"
                actionHref="/movies"
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map(booking => <BookingRow key={booking._id} booking={booking} />)}
        </div>
    );
}

export default BookingsPanel;
