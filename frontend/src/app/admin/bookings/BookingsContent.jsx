"use client";

import { useMemo, useState } from "react";

import { fetchBookings } from "@/services/AdminService";
import BookingDrawer from "@/components/admin/BookingDrawer";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import useListState from "@/components/admin/useListState";
import { EmptyList, SearchField, Segmented, TableButton } from "@/components/admin/ListToolbar";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const TONES = {
    confirmed: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
    paid: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
    pending: "bg-[#D99A34]/[0.14] text-[#E8B663]",
    unpaid: "bg-[#D99A34]/[0.14] text-[#E8B663]",
    refunded: "bg-[#4C8DD9]/[0.14] text-[#7CADEA]",
    cancelled: "bg-[#E5477A]/[0.14] text-[#E5477A]",
    expired: "bg-c-black-15 text-c-grey-60",
};

const Pill = ({ status }) => (
    <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-full capitalize whitespace-nowrap
        ${TONES[status] || TONES.expired}`}>
        {status}
    </span>
);

//! a hold that is about to lapse is the one an operator gets asked about on the
//! phone, so the row counts it down rather than just saying "pending"
const countdown = (expiresAt) => {
    const left = new Date(expiresAt) - Date.now();
    if (left <= 0) return null;

    const minutes = Math.floor(left / 60000);
    const seconds = Math.floor((left % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const BookingsContent = () => {
    const [status, setStatus] = useState("all");
    const [open, setOpen] = useState(null);

    const extraParams = useMemo(() => (status === "all" ? {} : { status }), [status]);
    const list = useListState(fetchBookings, { extraParams });

    //! the code is what a customer reads out, so search means "starts with this"
    const searchAsCode = useMemo(() => list.search.trim().toUpperCase(), [list.search]);
    const rows = useMemo(
        () => (searchAsCode ? list.rows.filter(b => b.bookingCode.includes(searchAsCode)) : list.rows),
        [list.rows, searchAsCode]
    );

    const columns = [
        {
            key: "bookingCode",
            label: "Code",
            render: (booking) => (
                <span className="font-mono text-c-grey-90 font-bold">{booking.bookingCode}</span>
            ),
        },
        { key: "user", label: "Customer", render: (booking) => booking.user?.email || "—" },
        {
            key: "screening",
            label: "Screening",
            render: (booking) => (
                <span className="capitalize">
                    {booking.showtime?.movie?.title || "—"}
                    <span className="text-c-grey-55 normal-case">
                        {booking.showtime?.startsAt
                            ? ` · ${new Date(booking.showtime.startsAt).toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
                            : ""}
                    </span>
                </span>
            ),
        },
        { key: "seats", label: "Seats", render: (booking) => booking.seats.map(seat => seat.label).join(", ") },
        { key: "totalPrice", label: "Total", align: "end", render: (booking) => money(booking.totalPrice) },
        { key: "payment", label: "Payment", render: (booking) => <Pill status={booking.payment?.status || "unpaid"} /> },
        {
            key: "status",
            label: "Status",
            render: (booking) => {
                const left = booking.status === "pending" && booking.expiresAt ? countdown(booking.expiresAt) : null;

                return (
                    <span className="flex items-center gap-1.5">
                        <Pill status={booking.isExpired ? "expired" : booking.status} />
                        {left && <span className="text-[10.5px] text-[#E8B663] tabular-nums">{left}</span>}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Box office" }]}
                title="Bookings"
                subtitle={list.pagination
                    ? `${list.pagination.total.toLocaleString("en-US")} bookings`
                    : "Loading the box office"}
            />

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <Segmented
                        value={status}
                        onChange={setStatus}
                        options={[
                            { id: "all", label: "All" },
                            { id: "confirmed", label: "Confirmed" },
                            { id: "pending", label: "Held" },
                            { id: "cancelled", label: "Cancelled" },
                            { id: "expired", label: "Expired" },
                        ]}
                    />
                    <SearchField value={list.search} onChange={list.setSearch} placeholder="Booking code" />

                    {list.rows.length > 0 && (
                        <span className="ms-auto text-[11.5px] text-c-grey-55">
                            <b className="text-[#6FCB9C]">{money(list.totals?.settled)}</b> settled ·{" "}
                            <b className="text-[#7CADEA]">{money(list.totals?.refunded)}</b> refunded
                        </span>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    rows={rows}
                    loading={list.loading}
                    error={list.error}
                    selectable={false}
                    pagination={list.pagination}
                    onPageChange={list.setPage}
                    rowActions={(booking) => (
                        <TableButton onClick={() => setOpen(booking._id)}>Open</TableButton>
                    )}
                    empty={
                        <EmptyList
                            searching={!!list.search}
                            term={list.search}
                            onClear={() => list.setSearch("")}
                            title="Nothing sold yet"
                            description="Bookings appear here as soon as somebody reserves a seat."
                        />
                    }
                />
            </div>

            {open && (
                <BookingDrawer
                    bookingId={open}
                    onClose={() => setOpen(null)}
                    onChanged={list.refresh}
                />
            )}
        </>
    );
}

export default BookingsContent;
