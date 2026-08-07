"use client";

const W = 560, H = 170, PAD_BOTTOM = 22;

const path = (values, max) => {
    const step = W / Math.max(values.length - 1, 1);
    //! scaled to (H - PAD_BOTTOM) so the line never runs into the date labels
    const y = (value) => (H - PAD_BOTTOM) - (value / max) * (H - PAD_BOTTOM - 14);

    return values
        .map((value, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${y(value).toFixed(1)}`)
        .join(" ");
};

const shortDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Two series on one pair of axes. They are on different scales — dollars and
 * ticket counts — so each is normalised against its own maximum; the shape is
 * what is being compared, not the absolute heights.
 *
 * Revenue is solid, tickets dashed. Distinguishing them by line style as well
 * as colour keeps the chart readable in greyscale and for colour-blind viewers.
 */
const RevenueChart = ({ series, days, onDaysChange }) => {
    const revenues = series.map(p => p.revenue);
    const tickets = series.map(p => p.tickets);
    const maxRevenue = Math.max(...revenues, 1);
    const maxTickets = Math.max(...tickets, 1);

    const revenueLine = path(revenues, maxRevenue);
    const ticketLine = path(tickets, maxTickets);

    return (
        <section className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3.5">
            <header className="flex items-center gap-2.5 mb-3">
                <h2 className="text-[13px] font-extrabold">Revenue and tickets</h2>
                <div className="ms-auto flex gap-1">
                    {[7, 30, 90].map(span => (
                        <button
                            key={span}
                            type="button"
                            onClick={() => onDaysChange(span)}
                            aria-pressed={days === span}
                            className={`text-[10.5px] font-bold py-[3px] px-2 rounded-[5px] duration-150
                                ${days === span ? "bg-c-black-12 text-c-grey-90" : "text-c-grey-55 hover:text-c-grey-65"}`}
                        >
                            {span}d
                        </button>
                    ))}
                </div>
            </header>

            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
                aria-label={`Revenue and ticket volume across the last ${days} days`}>
                <defs>
                    <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E50000" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#E50000" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <g stroke="#262626" strokeWidth="1">
                    {[20, 58, 96, 134].map(y => <line key={y} x1="0" y1={y} x2={W} y2={y} />)}
                </g>

                <path d={`${revenueLine} L${W} ${H - PAD_BOTTOM} L0 ${H - PAD_BOTTOM} Z`} fill="url(#rev-area)" />
                <path d={revenueLine} fill="none" stroke="#E50000" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                <path d={ticketLine} fill="none" stroke="#4C8DD9" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />

                <g fill="#6B6B6B" fontSize="9" fontFamily="inherit">
                    <text x="0" y={H - 4}>{shortDate(series[0].date)}</text>
                    <text x={W / 2 - 20} y={H - 4}>{shortDate(series[Math.floor(series.length / 2)].date)}</text>
                    <text x={W - 40} y={H - 4}>{shortDate(series[series.length - 1].date)}</text>
                </g>
            </svg>

            <div className="flex gap-3.5 text-[11px] text-c-grey-60 mt-2.5">
                <span className="flex items-center gap-1.5">
                    <i className="w-3.5 h-[2.5px] rounded-sm bg-c-red-45 block" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                    <i className="w-3.5 h-[2.5px] rounded-sm block"
                        style={{ background: "repeating-linear-gradient(90deg,#4C8DD9 0 4px,transparent 4px 7px)" }} />
                    Tickets
                </span>
            </div>
        </section>
    );
}

export default RevenueChart;
