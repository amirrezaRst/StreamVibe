"use client";

import { XmarkIcon } from "@/assets/Svgs";

const TIER_STRIPE = {
    standard: "bg-[#6B7484]",
    premium: "bg-[#C08341]",
    vip: "bg-[#D4AF37]",
};

const TicketChip = ({ seat, onRemove }) => {
    const row = seat.label.charAt(0);
    const number = seat.label.slice(1);

    return (
        <div
            title={`${seat.tier.charAt(0).toUpperCase()}${seat.tier.slice(1)} seat`}
            className="relative overflow-hidden flex items-center gap-2 py-2.5 pl-[11px] pr-[9px]
                       bg-gradient-to-b from-c-black-12 to-c-black-10 border border-c-black-15 rounded-[10px]"
        >
            {/*//! tier as an edge stripe keeps the row/seat text uncluttered */}
            <span className={`absolute left-0 inset-y-0 w-[3px] ${TIER_STRIPE[seat.tier] || TIER_STRIPE.standard}`} />

            <span className="flex items-baseline gap-[3px] min-w-0">
                <b className="text-sm font-extrabold tabular-nums text-c-grey-95">{row}</b>
                <span className="text-[10.5px] text-c-grey-60 font-semibold">row</span>
            </span>
            <span className="flex items-baseline gap-[3px] min-w-0">
                <b className="text-sm font-extrabold tabular-nums text-c-grey-95">{number.padStart(2, "0")}</b>
                <span className="text-[10.5px] text-c-grey-60 font-semibold">seat</span>
            </span>

            <span className="ml-auto text-[13px] font-extrabold tabular-nums text-c-grey-90 whitespace-nowrap">
                ${seat.price}
            </span>

            <button
                type="button"
                onClick={() => onRemove(seat.label)}
                aria-label={`Remove seat ${seat.label}`}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-[5px] text-c-grey-60 hover:text-white hover:bg-c-red-45 transition-colors"
            >
                <XmarkIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

const SelectedTickets = ({ seats, onRemove }) => (
    <div className={`grid gap-2.5 min-h-[52px] ${seats.length ? "grid-cols-2 max-[520px]:grid-cols-1" : "grid-cols-1"}`}>
        {seats.length === 0 ? (
            <div className="border border-dashed border-c-black-20 rounded-[10px] p-4 text-center text-c-grey-60 text-[13px]">
                Pick your seats from the map
            </div>
        ) : (
            [...seats]
                .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
                .map(seat => <TicketChip key={seat.label} seat={seat} onRemove={onRemove} />)
        )}
    </div>
);

export default SelectedTickets;
