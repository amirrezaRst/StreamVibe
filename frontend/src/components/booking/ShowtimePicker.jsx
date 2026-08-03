"use client";

import { ClockIcon } from "@/assets/Svgs";

//! "8:00 PM" split so the meridiem can sit quieter than the hour
const formatTime = (iso) => {
    const parts = new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
    }).split(" ");

    return { time: parts[0], meridiem: parts[1] };
};

const ShowtimePicker = ({ cinemas, selectedId, onSelect }) => {
    if (!cinemas.length) {
        return (
            <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5">
                <p className="flex items-center gap-[7px] text-xs font-bold text-c-grey-60 mb-3">
                    <ClockIcon className="w-3.5 h-3.5" /> Selected Time
                </p>
                <p className="text-c-grey-60 text-super-sm py-4 text-center">
                    No screenings on this date. Try another day.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5 flex flex-col gap-5">
            {cinemas.map(({ cinema, showtimes }) => (
                <div key={cinema._id}>
                    <p className="flex items-center gap-[7px] text-xs font-bold text-c-grey-60 mb-3">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {cinema.name} · {cinema.city}
                    </p>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2.5">
                        {showtimes.map(showtime => {
                            const { time, meridiem } = formatTime(showtime.startsAt);
                            const active = showtime._id === selectedId;

                            return (
                                <button
                                    key={showtime._id}
                                    type="button"
                                    onClick={() => onSelect(showtime._id)}
                                    aria-pressed={active}
                                    aria-label={`${time} ${meridiem}, ${showtime.hall?.screenType || ""}`}
                                    className={`rounded-[10px] py-2.5 px-2 border flex items-baseline justify-center gap-1 transition-all duration-150
                                        ${active
                                            ? "bg-gradient-to-b from-c-red-45/20 to-c-red-45/[0.07] border-c-red-45 shadow-[0_0_0_1px_rgba(229,0,0,0.35),0_8px_22px_-12px_rgba(229,0,0,0.8)]"
                                            : "bg-gradient-to-b from-c-black-12 to-c-black-10 border-c-black-15 hover:border-c-black-25"
                                        }`}
                                >
                                    <b className={`text-[15px] font-extrabold tabular-nums ${active ? "text-white" : "text-c-grey-90"}`}>
                                        {time}
                                    </b>
                                    <small className={`text-[10.5px] font-bold ${active ? "text-c-red-80" : "text-c-grey-60"}`}>
                                        {meridiem}
                                    </small>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ShowtimePicker;
