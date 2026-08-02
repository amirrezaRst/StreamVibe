"use client";

import { EnvelopeIcon } from "@/assets/Svgs";
import { fetchMyTickets } from "@/services/SupportService";
import EmptyState from "./EmptyState";
import PanelSkeleton from "./PanelSkeleton";
import StatusPill from "./StatusPill";
import usePanelData from "./usePanelData";

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });

const TicketRow = ({ ticket }) => (
    <div className="bg-c-black-10 border border-c-black-15 hover:border-c-black-20 rounded-xl py-[18px] px-5 flex items-start gap-4 duration-150">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-c-black-12 shrink-0 flex items-center justify-center text-c-grey-65">
            <EnvelopeIcon className="w-[18px] h-[18px]" />
        </div>

        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <span className="text-[14.5px] font-bold text-c-grey-90">{ticket.subject}</span>
                <StatusPill status={ticket.status} />
            </div>
            <p className="text-c-grey-60 text-super-sm truncate">{ticket.message}</p>
        </div>

        <span className="text-c-grey-60 text-[12.5px] shrink-0 tabular-nums pt-0.5">
            {formatDate(ticket.createdAt)}
        </span>
    </div>
);

const TicketsPanel = () => {
    const { items, error, loading } = usePanelData(fetchMyTickets);

    if (loading) return <PanelSkeleton count={3} />;
    if (error) return <p className="text-c-grey-60 text-super-sm">{error}</p>;

    if (!items.length) {
        return (
            <EmptyState
                icon={EnvelopeIcon}
                title="No support tickets yet"
                description="Questions or issues you send us will show up here so you can track their status."
                actionLabel="Contact Support"
                actionHref="/support"
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map(ticket => <TicketRow key={ticket._id} ticket={ticket} />)}
        </div>
    );
}

export default TicketsPanel;
