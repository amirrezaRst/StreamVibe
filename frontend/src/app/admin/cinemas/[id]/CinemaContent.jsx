"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { fetchCinema } from "@/services/AdminService";
import PageHeader from "@/components/admin/PageHeader";
import SeatMapThumb from "@/components/admin/SeatMapThumb";
import { TIERS } from "@/components/admin/seatTiers";

const HallRow = ({ hall, cinemaId }) => {
    const empty = !hall.seatMap?.length;

    return (
        <div className={`flex items-center gap-3.5 bg-c-black-10 border rounded-[10px] py-2.5 px-3.5 flex-wrap
            ${empty ? "border-[#D99A34]/30" : "border-c-black-15"}`}>
            <SeatMapThumb seatMap={hall.seatMap} />

            <div className="min-w-0">
                <p className="text-[13.5px] font-extrabold">{hall.name}</p>
                <p className="text-[11.5px] text-c-black-30">
                    {empty
                        ? `${hall.screenType} · no seat map yet`
                        : `${hall.screenType} · ${hall.rows} rows · ${hall.totalSeats} seats`}
                </p>
            </div>

            <div className="ms-auto flex items-center gap-1.5 flex-wrap">
                {empty ? (
                    <span className="text-[11px] font-bold text-[#E8B663] bg-[#D99A34]/[0.14]
                        border border-[#D99A34]/30 py-[3px] px-2.5 rounded-full">
                        Not bookable
                    </span>
                ) : (
                    TIERS.filter(tier => hall.tiers[tier.id]).map(tier => (
                        <span key={tier.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold
                            text-c-grey-65 bg-c-black-06 border border-c-black-15 py-[3px] px-2 rounded-full tabular-nums">
                            <i className="w-[9px] h-2 rounded-sm block" style={{ background: tier.fill }} />
                            {hall.tiers[tier.id]}
                        </span>
                    ))
                )}

                <Link
                    href={`/admin/cinemas/${cinemaId}/halls/${hall._id}`}
                    className={`rounded-[7px] py-1.5 px-3 text-[11.5px] font-bold border duration-150
                        ${empty
                            ? "bg-c-red-45 border-c-red-45 text-white hover:bg-c-red-45/85"
                            : "bg-c-black-12 border-c-black-20 text-c-grey-65 hover:text-c-grey-90"}`}
                >
                    {empty ? "Build the map" : "Edit seats"}
                </Link>
            </div>
        </div>
    );
};

const CinemaContent = ({ id }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            setData(await fetchCinema(id));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const cinema = data?.cinema;
    const halls = data?.halls || [];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Cinema" }, { label: "Cinemas", href: "/admin/cinemas" }]}
                title={cinema?.name || "Loading"}
                subtitle={cinema
                    ? `${cinema.city} · ${cinema.halls} hall${cinema.halls === 1 ? "" : "s"} · ${cinema.seats} seats · ${cinema.isActive ? "open" : "closed"}`
                    : "Loading the venue"}
            />

            <div className="p-[18px]">
                {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}

                {!data && !error && (
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="h-[62px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
                        ))}
                    </div>
                )}

                {data && (
                    <>
                        {cinema.address && (
                            <p className="text-[12.5px] text-c-grey-60 mb-3.5">{cinema.address}</p>
                        )}

                        {halls.length === 0 ? (
                            <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                                <p className="text-c-grey-90 text-sm font-semibold mb-1">No halls yet</p>
                                <p className="text-c-grey-60 text-[12.5px]">
                                    A venue needs at least one hall before anything can be screened in it.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {halls.map(hall => <HallRow key={hall._id} hall={hall} cinemaId={id} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export default CinemaContent;
