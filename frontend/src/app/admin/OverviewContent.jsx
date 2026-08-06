"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchOverview } from "@/services/AdminService";
import KpiRow from "@/components/admin/KpiRow";
import PageHeader from "@/components/admin/PageHeader";
import RevenueChart from "@/components/admin/RevenueChart";
import TonightStrip from "@/components/admin/TonightStrip";
import TopTitles from "@/components/admin/TopTitles";

//! seat occupancy genuinely moves minute to minute, which is the whole reason
//! the strip is on this page — a stale number would be worse than none
const REFRESH_MS = 30_000;

const Skeleton = () => (
    <div className="p-[18px] space-y-3.5">
        <div className="h-[132px] rounded-[11px] bg-c-black-10 border border-c-black-15 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr] gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-[118px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
            ))}
        </div>
        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-2.5">
            <div className="h-[248px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
            <div className="h-[248px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
        </div>
    </div>
);

const OverviewContent = () => {
    const [days, setDays] = useState(30);
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(null);

    //! a refresh landing after the span changed would paint the wrong window
    const requestedDays = useRef(30);

    const load = useCallback(async (span) => {
        requestedDays.current = span;
        try {
            const data = await fetchOverview(span);
            if (requestedDays.current !== span) return;

            setOverview(data);
            setError(null);
            setUpdatedAt(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
        } catch (err) {
            //! a failed refresh must not blank a screen that already has numbers
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        setOverview(null);
        load(days);
    }, [days, load]);

    useEffect(() => {
        const timer = setInterval(() => load(days), REFRESH_MS);
        return () => clearInterval(timer);
    }, [days, load]);

    return (
        <>
            <PageHeader
                title="Overview"
                subtitle={overview
                    ? `Box office and screenings across the last ${overview.window} days`
                    : "Loading the last 30 days"}
            />

            {error && !overview && (
                <div className="p-[18px]">
                    <p className="text-c-grey-60 text-super-sm">{error}</p>
                </div>
            )}

            {!overview && !error && <Skeleton />}

            {overview && (
                <div className="p-[18px]">
                    <TonightStrip screenings={overview.tonight} updatedAt={updatedAt} />
                    <KpiRow kpis={overview.kpis} series={overview.series} />
                    <div className="grid xl:grid-cols-[1.5fr_1fr] gap-2.5">
                        <RevenueChart series={overview.series} days={days} onDaysChange={setDays} />
                        <TopTitles titles={overview.topTitles} />
                    </div>
                </div>
            )}
        </>
    );
}

export default OverviewContent;
