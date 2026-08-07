"use client";

const formatTime = (iso) => {
    const parts = new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
    }).split(" ");

    return { time: parts[0], meridiem: parts[1] };
};

/**
 * Occupancy drawn as a row of seats rather than a progress bar. It is the thing
 * being measured, so it should look like it — and it is the same shape the
 * public seat picker uses, which makes the two read as one product.
 *
 * Eight blocks stand in for the whole hall; a partly-filled block is the
 * remainder, so a room at 88% does not round up to "full".
 */
const SeatMeter = ({ occupancy }) => {
    const blocks = 8;
    const filled = Math.floor((occupancy / 100) * blocks);
    const partial = (occupancy / 100) * blocks - filled >= 0.35;

    return (
        <div className="flex gap-0.5 mb-1.5" aria-hidden="true">
            {Array.from({ length: blocks }, (_, i) => (
                <i
                    key={i}
                    className={`flex-1 h-[7px] rounded-[1.5px] block ${i < filled ? "bg-c-red-45"
                        : i === filled && partial ? "bg-c-red-45/45"
                            : "bg-c-black-20"
                        }`}
                />
            ))}
        </div>
    );
};

const TonightStrip = ({ screenings, updatedAt }) => (
    <section className="bg-gradient-to-b from-c-black-10 to-c-black-08 border border-c-black-15 rounded-[11px] py-3.5 px-4 mb-3.5">
        <header className="flex items-center gap-2.5 mb-3 flex-wrap">
            <h2 className="text-[13px] font-extrabold">On screen tonight</h2>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#6FCB9C] bg-[#3DA872]/[0.14] py-0.5 px-2 rounded-full">
                <i className="w-[5px] h-[5px] rounded-full bg-[#3DA872] block motion-safe:animate-pulse" />
                Live
            </span>
            {updatedAt && (
                <span className="ms-auto text-[11.5px] text-c-grey-55 tabular-nums">
                    Updated {updatedAt}
                </span>
            )}
        </header>

        {screenings.length === 0 ? (
            <p className="text-c-grey-60 text-[12.5px] py-3">
                Nothing else screens today. The next showings are on the schedule.
            </p>
        ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-2.5">
                {screenings.map(screening => {
                    const { time, meridiem } = formatTime(screening.startsAt);

                    return (
                        <article key={screening._id} className="bg-c-black-06 border border-c-black-15 rounded-[9px] py-2.5 px-[11px]">
                            <div className="flex items-baseline gap-1.5 mb-0.5">
                                <span className="text-[13px] font-extrabold tabular-nums">{time}</span>
                                <span className="text-[10.5px] text-c-grey-55 truncate">
                                    {meridiem} · {screening.hall?.name} · {screening.hall?.screenType}
                                </span>
                            </div>
                            <p className="text-[11.5px] text-c-grey-65 truncate capitalize">
                                {screening.movie?.title || "—"}
                            </p>
                            {/*//! without the venue, two halls called "Screen 2" in
                                different cinemas are indistinguishable */}
                            <p className="text-[10.5px] text-c-grey-55 truncate mb-2">
                                {screening.cinema?.name}
                            </p>

                            <SeatMeter occupancy={screening.occupancy} />

                            <div className="flex justify-between text-[10.5px] text-c-grey-55 tabular-nums">
                                <span><b className="text-c-grey-90 font-bold">{screening.taken}</b>/{screening.capacity} seats</span>
                                <span>{screening.occupancy}%</span>
                            </div>
                        </article>
                    );
                })}
            </div>
        )}
    </section>
);

export default TonightStrip;
