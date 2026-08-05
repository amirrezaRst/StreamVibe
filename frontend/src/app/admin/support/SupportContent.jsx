"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { deleteTicket, fetchAllTickets, setTicketStatus } from "@/services/SupportService";
import PageHeader from "@/components/admin/PageHeader";
import { Segmented, TableButton } from "@/components/admin/ListToolbar";
import { EnvelopeIcon } from "@/components/admin/AdminIcons";

const TONES = {
    pending: "bg-[#D99A34]/[0.14] text-[#E8B663]",
    "in progress": "bg-[#4C8DD9]/[0.14] text-[#7CADEA]",
    resolved: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
};

const shortDate = (iso) => new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
const longDate = (iso) => new Date(iso).toLocaleString("en-US", {
    day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
});

const Pill = ({ status }) => (
    <span className={`text-[10.5px] font-extrabold py-0.5 px-2 rounded-full capitalize shrink-0 ${TONES[status]}`}>
        {status}
    </span>
);

/**
 * The one section that is not a table. A ticket is a paragraph somebody wrote
 * and expects an answer to; squeezing it into a row truncates the only part
 * that matters. Queue on the left, the ticket open beside it.
 */
const SupportContent = () => {
    const [tickets, setTickets] = useState(null);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("pending");
    const [openId, setOpenId] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setTickets(await fetchAllTickets());
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const counts = useMemo(() => {
        const all = tickets || [];
        return {
            pending: all.filter(t => t.status === "pending").length,
            "in progress": all.filter(t => t.status === "in progress").length,
            resolved: all.filter(t => t.status === "resolved").length,
        };
    }, [tickets]);

    const queue = useMemo(
        () => (tickets || [])
            .filter(ticket => ticket.status === filter)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [tickets, filter]
    );

    //! keep something open as the queue changes under you, but never point at a
    //! ticket that has just moved to another tab
    useEffect(() => {
        if (!queue.length) { setOpenId(null); return; }
        if (!queue.some(ticket => ticket._id === openId)) setOpenId(queue[0]._id);
    }, [queue, openId]);

    const open = queue.find(ticket => ticket._id === openId);

    const move = async (ticket, status) => {
        setBusy(true);
        try {
            const result = await setTicketStatus(ticket._id, status);
            toast.success(result.message);
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const remove = async (ticket) => {
        if (!window.confirm(`Delete “${ticket.subject}”? This cannot be undone.`)) return;

        setBusy(true);
        try {
            await deleteTicket(ticket._id);
            toast.success("Ticket deleted");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Community" }]}
                title="Support"
                subtitle={tickets
                    ? `${counts.pending} waiting · ${counts["in progress"]} in progress · ${counts.resolved} resolved`
                    : "Loading the inbox"}
            />

            <div className="p-[18px]">
                <div className="mb-3">
                    <Segmented
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { id: "pending", label: "Open", count: counts.pending },
                            { id: "in progress", label: "In progress", count: counts["in progress"] },
                            { id: "resolved", label: "Resolved", count: counts.resolved },
                        ]}
                    />
                </div>

                {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}
                {!tickets && !error && (
                    <div className="h-[340px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
                )}

                {tickets && queue.length === 0 && (
                    <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                        <div className="w-[46px] h-[46px] rounded-full bg-c-black-10 border border-c-black-15 flex items-center justify-center mx-auto mb-3.5 text-c-grey-65">
                            <EnvelopeIcon className="w-5 h-5" />
                        </div>
                        <p className="text-c-grey-90 text-sm font-semibold mb-1">
                            {filter === "pending" ? "Nothing waiting" : `Nothing ${filter}`}
                        </p>
                        <p className="text-c-grey-60 text-[12.5px]">
                            {filter === "pending" ? "The inbox is clear." : "No tickets in this state."}
                        </p>
                    </div>
                )}

                {tickets && queue.length > 0 && (
                    <div className="grid md:grid-cols-[280px_1fr] border border-c-black-15 rounded-[10px] overflow-hidden bg-c-black-10 min-h-[380px]">
                        <div className="md:border-e border-c-black-15 max-h-[520px] overflow-y-auto">
                            {queue.map(ticket => (
                                <button
                                    key={ticket._id}
                                    type="button"
                                    onClick={() => setOpenId(ticket._id)}
                                    aria-current={ticket._id === openId ? "true" : undefined}
                                    className={`w-full text-start py-2.5 px-3 border-b border-c-black-15 border-s-2 duration-150
                                        ${ticket._id === openId
                                            ? "bg-c-black-12 border-s-c-red-45"
                                            : "border-s-transparent hover:bg-c-black-12"}`}
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[12.5px] font-bold text-c-grey-90 truncate flex-1">{ticket.subject}</span>
                                        <Pill status={ticket.status} />
                                    </div>
                                    <p className="text-[11px] text-c-black-30 truncate">
                                        {ticket.email} · {shortDate(ticket.createdAt)}
                                    </p>
                                    <p className="text-[11.5px] text-c-grey-60 truncate mt-0.5">{ticket.message}</p>
                                </button>
                            ))}
                        </div>

                        {open && (
                            <div className="p-4 md:p-[18px]">
                                <h2 className="text-[15px] font-extrabold mb-1.5">{open.subject}</h2>
                                <div className="flex items-center gap-2.5 flex-wrap text-[11.5px] text-c-black-30 pb-3 mb-3 border-b border-c-black-15">
                                    <Pill status={open.status} />
                                    <span className="text-c-grey-65">{open.fullName} &lt;{open.email}&gt;</span>
                                    <span>·</span>
                                    <span>{longDate(open.createdAt)}</span>
                                    {/*//! whether the sender has an account changes how you answer,
                                        and anonymous senders cannot be replied to in-product */}
                                    <span>·</span>
                                    <span className={open.user ? "text-[#7CADEA]" : "text-c-black-30"}>
                                        {open.user ? "Signed-in member" : "Not signed in"}
                                    </span>
                                </div>

                                <p className="text-[13px] text-c-grey-65 leading-relaxed whitespace-pre-line">
                                    {open.message}
                                </p>

                                <div className="flex gap-2 flex-wrap mt-5 pt-3.5 border-t border-c-black-15">
                                    {open.status !== "in progress" && (
                                        <TableButton onClick={() => move(open, "in progress")} disabled={busy}>
                                            Mark in progress
                                        </TableButton>
                                    )}
                                    {open.status !== "resolved" && (
                                        <TableButton tone="good" onClick={() => move(open, "resolved")} disabled={busy}>
                                            Mark resolved
                                        </TableButton>
                                    )}
                                    {open.status !== "pending" && (
                                        <TableButton onClick={() => move(open, "pending")} disabled={busy}>
                                            Reopen
                                        </TableButton>
                                    )}
                                    <a
                                        href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                                        className="rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border border-c-black-20
                                            bg-c-black-12 text-c-grey-65 hover:text-c-grey-90 duration-150 inline-flex items-center"
                                    >
                                        Reply by email
                                    </a>
                                    <TableButton tone="danger" onClick={() => remove(open)} disabled={busy} className="ms-auto">
                                        Delete
                                    </TableButton>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default SupportContent;
