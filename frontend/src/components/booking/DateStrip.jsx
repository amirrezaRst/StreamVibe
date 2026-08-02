"use client";

import { CalendarIcon } from "@/assets/Svgs";

const DAYS_SHOWN = 7;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//! the shared arrow icons are long directional arrows sized for banners, and
//! RightArrowSvg ignores props — a plain chevron suits these 34px buttons
const Chevron = ({ dir }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
);

//! local calendar day, not UTC — "today" has to mean the user's today
export const toDateKey = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const DateStrip = ({ selectedDate, onSelect, offset = 0, onOffsetChange }) => {
    const days = Array.from({ length: DAYS_SHOWN }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + offset + i);
        return date;
    });

    return (
        <div className="flex items-stretch gap-2.5 mb-6">
            <div className="shrink-0 w-[52px] bg-c-black-10 border border-c-black-15 rounded-xl text-c-grey-70 flex items-center justify-center">
                <CalendarIcon className="w-[19px] h-[19px]" />
            </div>

            <div className="flex gap-2.5 flex-1 min-w-0 max-md:overflow-x-auto max-md:pb-1">
                {days.map((date, i) => {
                    const key = toDateKey(date);
                    const active = key === selectedDate;
                    const isToday = offset === 0 && i === 0;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(key)}
                            aria-pressed={active}
                            className={`flex-1 min-w-0 max-md:flex-none max-md:w-[84px] rounded-xl pt-3 pb-3.5 px-1.5 text-center border transition-all duration-150
                                ${active
                                    ? "bg-gradient-to-b from-c-red-45/20 to-c-red-45/[0.07] border-c-red-45 shadow-[0_0_0_1px_rgba(229,0,0,0.35),0_8px_22px_-12px_rgba(229,0,0,0.8)]"
                                    : "bg-gradient-to-b from-c-black-12 to-c-black-10 border-c-black-15 hover:border-c-black-25"
                                }`}
                        >
                            <div className={`text-[11.5px] font-bold ${active ? "text-c-red-80" : "text-c-grey-60"}`}>
                                {isToday ? "Today" : DOW[date.getDay()]}
                            </div>
                            <div className={`text-[22px] font-extrabold mt-0.5 leading-tight tabular-nums ${active ? "text-white" : "text-c-grey-90"}`}>
                                {date.getDate()}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="shrink-0 flex flex-col gap-1.5 max-md:hidden">
                <button
                    type="button"
                    aria-label="Previous days"
                    disabled={offset === 0}
                    onClick={() => onOffsetChange(Math.max(0, offset - DAYS_SHOWN))}
                    className="flex-1 w-[34px] bg-c-black-10 border border-c-black-15 rounded-[9px] text-c-grey-70 flex items-center justify-center hover:border-c-black-25 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                    <Chevron dir="left" />
                </button>
                <button
                    type="button"
                    aria-label="Next days"
                    onClick={() => onOffsetChange(offset + DAYS_SHOWN)}
                    className="flex-1 w-[34px] bg-c-black-10 border border-c-black-15 rounded-[9px] text-c-grey-70 flex items-center justify-center hover:border-c-black-25 hover:text-white transition-colors"
                >
                    <Chevron dir="right" />
                </button>
            </div>
        </div>
    );
}

export default DateStrip;
