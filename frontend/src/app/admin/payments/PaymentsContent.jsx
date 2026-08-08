"use client";

import { useMemo, useState } from "react";

import { fetchPayments } from "@/services/AdminService";
import BookingDrawer from "@/components/admin/BookingDrawer";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import useListState from "@/components/admin/useListState";
import { Segmented, TableButton } from "@/components/admin/ListToolbar";

const money = (value) => {
    const amount = Number(value || 0);
    const sign = amount < 0 ? "−" : "";
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

const when = (iso) => new Date(iso).toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
});

const Tile = ({ label, value, tone }) => (
    <div className="bg-c-black-10 border border-c-black-15 rounded-[10px] py-3 px-3.5 flex-1 min-w-[140px]">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-grey-55 mb-1.5">{label}</p>
        <p className={`text-[21px] font-extrabold tracking-[-0.02em] tabular-nums leading-tight ${tone}`}>{value}</p>
    </div>
);

const PaymentsContent = () => {
    const [kind, setKind] = useState("all");
    const [open, setOpen] = useState(null);

    const extraParams = useMemo(() => (kind === "all" ? {} : { kind }), [kind]);
    const list = useListState(fetchPayments, { extraParams });

    const totals = list.totals;

    const columns = [
        {
            key: "kind",
            label: "Type",
            render: (entry) => (
                <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-full capitalize whitespace-nowrap
                    ${entry.kind === "charge"
                        ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]"
                        : "bg-[#4C8DD9]/[0.14] text-[#7CADEA]"}`}>
                    {entry.kind}
                </span>
            ),
        },
        { key: "at", label: "When", render: (entry) => when(entry.at) },
        {
            key: "bookingCode",
            label: "Booking",
            render: (entry) => <span className="font-mono text-c-grey-90 font-bold">{entry.bookingCode}</span>,
        },
        { key: "customer", label: "Customer", render: (entry) => entry.customer?.email || "—" },
        { key: "title", label: "Film", render: (entry) => <span className="capitalize">{entry.title || "—"}</span> },
        {
            key: "amount",
            label: "Amount",
            align: "end",
            render: (entry) => (
                <span className={entry.amount < 0 ? "text-[#7CADEA] font-bold" : "text-c-grey-90 font-bold"}>
                    {money(entry.amount)}
                </span>
            ),
        },
        {
            key: "intentId",
            label: "Gateway",
            render: (entry) => (
                <span className="font-mono text-[10.5px] text-c-grey-55" title={entry.intentId || ""}>
                    {entry.intentId ? `${entry.intentId.slice(0, 14)}…` : "—"}
                </span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Box office" }]}
                title="Payments"
                subtitle={totals
                    ? `${totals.charges} charge${totals.charges === 1 ? "" : "s"} · ${totals.refunds} refund${totals.refunds === 1 ? "" : "s"} through the gateway`
                    : "Loading the ledger"}
            />

            <div className="p-[18px]">
                {totals && (
                    <div className="flex gap-2.5 flex-wrap mb-3.5">
                        <Tile label="Charged" value={money(totals.charged)} tone="text-[#6FCB9C]" />
                        <Tile label="Refunded" value={money(totals.refunded)} tone="text-[#7CADEA]" />
                        {/*//! what was actually kept, which is neither of the two above
                            and is the number anyone asking about revenue means */}
                        <Tile label="Net" value={money(totals.net)} tone="text-c-grey-95" />
                    </div>
                )}

                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <Segmented
                        value={kind}
                        onChange={setKind}
                        options={[
                            { id: "all", label: "Everything" },
                            { id: "charge", label: "Charges" },
                            { id: "refund", label: "Refunds" },
                        ]}
                    />
                    <span className="ms-auto text-[11px] text-c-grey-55">
                        Ordered by when the money moved, not when the booking was made.
                    </span>
                </div>

                <DataTable
                    columns={columns}
                    rows={list.rows}
                    rowKey={(entry) => entry._id}
                    loading={list.loading}
                    error={list.error}
                    selectable={false}
                    pagination={list.pagination}
                    onPageChange={list.setPage}
                    rowActions={(entry) => (
                        <TableButton onClick={() => setOpen(entry.bookingId)}>Booking</TableButton>
                    )}
                    empty={
                        <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                            <p className="text-c-grey-90 text-sm font-semibold mb-1">Nothing has moved yet</p>
                            <p className="text-c-grey-60 text-[12.5px] max-w-[42ch] mx-auto">
                                Charges and refunds appear here once a booking is paid for through the gateway.
                            </p>
                        </div>
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

export default PaymentsContent;
