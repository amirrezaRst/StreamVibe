"use client";

//! a change of null means there was nothing to compare against — coming up from
//! zero is not "infinity percent", it is simply the first window
const Delta = ({ change }) => {
    if (change === null || change === undefined) {
        return <span className="text-[11px] text-c-grey-55">no earlier period</span>;
    }

    const up = change >= 0;
    return (
        <span className={`text-[11px] font-extrabold py-px px-[7px] rounded-full tabular-nums
            ${up ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]" : "bg-[#E5477A]/[0.14] text-[#E5477A]"}`}>
            {up ? "+" : "−"}{Math.abs(change)}%
        </span>
    );
};

/**
 * Draws the series as an area with the last point marked. Hand-rolled rather
 * than pulled from a charting library: three charts do not justify the
 * dependency, and this one inherits the palette exactly instead of being
 * themed into submission.
 */
const Sparkline = ({ points }) => {
    if (!points || points.length < 2) return null;

    const values = points.map(p => p.revenue);
    const max = Math.max(...values, 1);
    const step = 260 / (points.length - 1);
    //! a flat series would otherwise pin to the baseline and look like zero
    const y = (value) => 40 - (value / max) * 32;

    const line = values.map((value, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
    const last = { x: 260, y: y(values[values.length - 1]) };

    return (
        <svg viewBox="0 0 260 44" width="100%" height="44" preserveAspectRatio="none"
            role="img" aria-label="Box office trend across the selected window" className="mt-auto pt-2.5">
            <defs>
                <linearGradient id="kpi-spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E50000" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#E50000" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${line} L260 44 L0 44 Z`} fill="url(#kpi-spark)" />
            <path d={line} fill="none" stroke="#E50000" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={last.x} cy={last.y} r="2.8" fill="#E50000" />
        </svg>
    );
};

const Tile = ({ label, value, change, lead, children }) => (
    <article className={`border rounded-[10px] py-3 px-3.5 flex flex-col
        ${lead
            ? "bg-gradient-to-br from-c-red-45/[0.06] to-c-black-10 border-c-red-45/[0.22]"
            : "bg-c-black-10 border-c-black-15"}`}>
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-grey-55 mb-1.5">{label}</p>
        <p className={`font-extrabold tracking-[-0.02em] tabular-nums leading-tight ${lead ? "text-[31px]" : "text-[23px]"}`}>
            {value}
        </p>
        <div className="flex items-center gap-[7px] mt-[7px]">
            <Delta change={change} />
            {/*//! "no earlier period" already explains itself; following it with
                "vs the window before" would contradict it */}
            {lead && change !== null && change !== undefined && (
                <span className="text-[11px] text-c-grey-55">vs the window before</span>
            )}
        </div>
        {children}
    </article>
);

const money = (value) => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const KpiRow = ({ kpis, series }) => (
    <div className="grid grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr] gap-2.5 mb-3.5">
        <Tile lead label="Box office" value={money(kpis.revenue.value)} change={kpis.revenue.change}>
            <Sparkline points={series} />
        </Tile>
        <Tile label="Tickets sold" value={kpis.tickets.value.toLocaleString("en-US")} change={kpis.tickets.change} />
        <Tile label="Avg. occupancy" value={`${kpis.occupancy.value}%`} change={kpis.occupancy.change} />
        <Tile label="New members" value={kpis.members.value.toLocaleString("en-US")} change={kpis.members.change} />
    </div>
);

export default KpiRow;
