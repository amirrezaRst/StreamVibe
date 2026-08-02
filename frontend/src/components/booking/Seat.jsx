"use client";

//! tier styling reads as a metal ladder (steel -> bronze -> gold) so the three
//! prices are distinguishable without competing with the red "selected" state
const TIER_CLASS = {
    standard: "bg-[#48505C]/40 border-[#48505C] hover:bg-[#6B7484]",
    premium: "bg-[#8A5A2B]/35 border-[#8A5A2B] hover:bg-[#C08341]",
    vip: "bg-[#8A7320]/35 border-[#8A7320] hover:bg-[#D4AF37]",
};

const Seat = ({ label, number, tier, price, taken, selected, disabled, onToggle }) => {
    //! an aisle: keeps the column rhythm without being a seat
    if (disabled) {
        return <span className="w-[26px] h-[26px] shrink-0" aria-hidden="true" />;
    }

    const base = "w-[26px] h-[26px] shrink-0 rounded-t-md rounded-b-[3px] border text-[9.5px] font-bold flex items-center justify-center transition-all duration-150 p-0";

    if (taken) {
        return (
            <button
                type="button"
                disabled
                aria-label={`Seat ${label}, unavailable`}
                className={`${base} bg-c-black-12 border-c-black-15 opacity-55 cursor-not-allowed text-transparent relative`}
            >
                <span className="absolute w-[11px] h-[1.5px] bg-c-black-25 rounded-sm" />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onToggle(label)}
            aria-pressed={selected}
            aria-label={`Seat ${label}, ${tier}, $${price}`}
            className={`${base} ${selected
                ? "bg-c-red-45 border-c-red-60 text-white -translate-y-0.5 shadow-[0_0_0_3px_rgba(229,0,0,0.13),0_4px_12px_-2px_rgba(229,0,0,0.55)]"
                : `${TIER_CLASS[tier] || TIER_CLASS.standard} text-transparent hover:-translate-y-0.5`
                }`}
        >
            {number}
        </button>
    );
}

export default Seat;
