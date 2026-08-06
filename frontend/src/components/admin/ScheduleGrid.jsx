"use client";

//! the window a cinema day actually spans. Anything outside it would be mostly
//! empty columns, and a screening that starts before 10am is rare enough to be
//! clamped to the edge rather than widening the grid for everyone.
export const DAY_START = 10;
export const DAY_END = 24;
const HOURS = DAY_END - DAY_START;

const TURNAROUND_MINUTES = 15;

const hourLabel = (hour) => {
    const h = hour % 24;
    if (h === 0) return "12a";
    if (h === 12) return "12p";
    return h > 12 ? `${h - 12}p` : `${h}a`;
};

const timeLabel = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
}).replace(":00", "");

//! position as a percentage of the visible day, so the grid stays fluid rather
//! than needing a fixed pixel width per hour
const positionOf = (showtime) => {
    const start = new Date(showtime.startsAt);
    const end = new Date(showtime.endsAt);

    const startHours = start.getHours() + start.getMinutes() / 60;
    //! measured from the start rather than read off the clock: a screening that
    //! runs past midnight has an end hour smaller than its start hour, and
    //! subtracting those gives a negative width
    const runHours = (end - start) / 3600000;

    const left = Math.max(((startHours - DAY_START) / HOURS) * 100, 0);
    const width = (runHours / HOURS) * 100;
    const turnaround = ((TURNAROUND_MINUTES / 60) / HOURS) * 100;

    return {
        left,
        //! clipped at the right edge, so a late film stops at midnight instead
        //! of pushing the grid wider than the day it belongs to
        width: Math.max(Math.min(width, 100 - left), 1.5),
        turnaround,
        //! whether it was cut short by that clip, which the caller marks
        overruns: left + width > 100,
    };
};

/**
 * Two screenings collide when one starts before the other has cleared the room,
 * turnaround included. The API refuses to save one, but a schedule that already
 * contains one — from a seed, or from a run scheduled before the check existed —
 * should still say so rather than drawing them as if nothing were wrong.
 */
const findClashes = (showtimes) => {
    const clashing = new Set();

    showtimes.forEach((a, i) => {
        showtimes.slice(i + 1).forEach(b => {
            if (String(a.hall) !== String(b.hall)) return;

            const aEnd = new Date(a.endsAt).getTime() + TURNAROUND_MINUTES * 60000;
            const bEnd = new Date(b.endsAt).getTime() + TURNAROUND_MINUTES * 60000;

            if (new Date(a.startsAt).getTime() < bEnd && new Date(b.startsAt).getTime() < aEnd) {
                clashing.add(String(a._id));
                clashing.add(String(b._id));
            }
        });
    });

    return clashing;
};

//! colour groups a title across its screenings and carries no other meaning —
//! it is a grouping device, not a status
const TONES = [
    { bg: "rgba(229,0,0,0.2)", border: "#E50000" },
    { bg: "rgba(76,141,217,0.18)", border: "#4C8DD9" },
    { bg: "rgba(200,162,74,0.18)", border: "#C8A24A" },
    { bg: "rgba(61,168,114,0.18)", border: "#3DA872" },
    { bg: "rgba(229,71,122,0.18)", border: "#E5477A" },
];

const ScheduleGrid = ({ halls, showtimes, onPick, onOpen }) => {
    const clashing = findClashes(showtimes);

    //! stable per title across the whole day, so the same film is the same
    //! colour in every hall it plays in
    const titles = [...new Set(showtimes.map(s => String(s.movie?._id)))];
    const toneOf = (showtime) => TONES[titles.indexOf(String(showtime.movie?._id)) % TONES.length];

    return (
        <div className="overflow-x-auto">
            <div
                className="grid border border-c-black-15 rounded-[10px] overflow-hidden bg-c-black-10 min-w-[940px]"
                style={{ gridTemplateColumns: `96px repeat(${HOURS}, minmax(58px, 1fr))` }}
            >
                <div className="bg-c-black-12 border-b border-c-black-15" />
                {Array.from({ length: HOURS }, (_, i) => (
                    <div key={i} className="bg-c-black-12 border-b border-c-black-15 py-1.5 px-1
                        text-center text-[9.5px] font-extrabold text-c-grey-60 tabular-nums">
                        {hourLabel(DAY_START + i)}
                    </div>
                ))}

                {halls.map(hall => {
                    const mine = showtimes.filter(s => String(s.hall) === String(hall._id));

                    return (
                        <div key={hall._id} className="contents">
                            <div className="bg-c-black-12 border-b border-e border-c-black-15 py-2 px-2.5">
                                <p className="text-[11px] font-bold text-c-grey-90">{hall.name}</p>
                                <p className="text-[9.5px] text-c-black-30">
                                    {hall.screenType} · {hall.totalSeats}
                                </p>
                            </div>

                            {/*//! one cell per hour for the click target and the grid lines,
                                with the screenings laid over the whole row so a film can
                                span hours without being cut at every boundary */}
                            <div className="relative border-b border-c-black-15" style={{ gridColumn: `span ${HOURS}` }}>
                                <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${HOURS}, 1fr)` }}>
                                    {Array.from({ length: HOURS }, (_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => onPick(hall, DAY_START + i)}
                                            title={`Schedule something in ${hall.name} at ${hourLabel(DAY_START + i)}`}
                                            className="border-e border-c-black-15 min-h-[44px] group
                                                hover:bg-white/[0.02] duration-150 relative"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center
                                                text-c-black-25 text-sm opacity-0 group-hover:opacity-100 duration-150">
                                                +
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {mine.map(showtime => {
                                    const { left, width, turnaround, overruns } = positionOf(showtime);
                                    const clash = clashing.has(String(showtime._id));
                                    const tone = toneOf(showtime);

                                    return (
                                        <button
                                            key={showtime._id}
                                            type="button"
                                            onClick={() => onOpen(showtime)}
                                            title={`${showtime.movie?.title} · ${timeLabel(showtime.startsAt)} · ${showtime.taken}/${showtime.capacity} seats`}
                                            className={`absolute top-[3px] bottom-[3px] rounded text-start px-1.5 py-[3px]
                                                overflow-hidden border-s-2 duration-150 hover:brightness-125
                                                ${clash ? "border border-dashed !border-[#FF3333]" : ""}`}
                                            style={{
                                                insetInlineStart: `${left}%`,
                                                width: `${width}%`,
                                                background: clash ? "rgba(229,0,0,0.3)" : tone.bg,
                                                borderInlineStartColor: tone.border,
                                            }}
                                        >
                                            <span className="block text-[9.5px] font-bold text-white truncate capitalize">
                                                {showtime.movie?.title || "—"}
                                            </span>
                                            <span className="block text-[8.5px] text-white/60 truncate tabular-nums">
                                                {timeLabel(showtime.startsAt)}
                                                {clash ? " · overlaps" : ` · ${showtime.taken}/${showtime.capacity}`}
                                                {/*//! it does not end on this day's grid, and a block
                                                    that stops at the edge would imply it does */}
                                                {overruns && !clash && " · runs past midnight"}
                                            </span>

                                            {/*//! the fill along the bottom edge, so a sparse
                                                afternoon reads without a number being parsed */}
                                            <span
                                                className="absolute bottom-0 start-0 h-[2px] bg-[#3DA872]"
                                                style={{ width: `${showtime.occupancy}%` }}
                                            />
                                            {/*//! the 15 minutes the room is not free again yet */}
                                            <span
                                                className="absolute top-0 bottom-0 pointer-events-none"
                                                style={{
                                                    insetInlineEnd: `-${(turnaround / width) * 100}%`,
                                                    width: `${(turnaround / width) * 100}%`,
                                                    background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,.06) 3px,rgba(255,255,255,.06) 6px)",
                                                }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ScheduleGrid;
