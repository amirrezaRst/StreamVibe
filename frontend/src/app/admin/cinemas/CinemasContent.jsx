"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { fetchCinemas } from "@/services/AdminService";
import CinemaDrawer from "@/components/admin/CinemaDrawer";
import PageHeader from "@/components/admin/PageHeader";
import { Segmented } from "@/components/admin/ListToolbar";
import { HouseIcon } from "@/components/admin/AdminIcons";

const Fact = ({ value, label }) => (
    <span>
        <b className="block text-c-grey-90 text-[13px] font-extrabold tabular-nums">{value}</b>
        <span className="text-[10px] text-c-grey-55 uppercase tracking-[0.05em]">{label}</span>
    </span>
);

const CinemaCard = ({ cinema }) => (
    <Link
        href={`/admin/cinemas/${cinema._id}`}
        className="bg-c-black-10 border border-c-black-15 hover:border-c-black-20 rounded-xl overflow-hidden duration-150 block"
    >
        <div className="h-24 relative overflow-hidden bg-gradient-to-br from-[#241014] to-c-black-08">
            {cinema.image && (
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${cinema.image}`}
                    alt=""
                    width={400} height={192}
                    className="w-full h-full object-cover opacity-55"
                />
            )}
            <span className={`absolute top-2 start-2 text-[10px] font-extrabold uppercase tracking-[0.06em]
                py-0.5 px-2 rounded-full backdrop-blur-sm
                ${cinema.isActive ? "bg-[#3DA872]/20 text-[#6FCB9C]" : "bg-c-black-08/70 text-c-grey-60"}`}>
                {cinema.isActive ? "Open" : "Closed"}
            </span>
        </div>

        <div className="py-3 px-3.5">
            <h3 className="text-sm font-extrabold mb-0.5 capitalize">{cinema.name}</h3>
            <p className="text-[11.5px] text-c-grey-55 mb-2.5 capitalize">
                {cinema.city}{cinema.country ? ` · ${cinema.country}` : ""}
            </p>

            <div className="flex gap-3.5 border-t border-c-black-15 pt-2.5">
                <Fact value={cinema.halls} label="Halls" />
                <Fact value={cinema.seats.toLocaleString("en-US")} label="Seats" />
                <Fact value={cinema.screeningsToday} label="Today" />
            </div>

            {cinema.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                    {cinema.amenities.slice(0, 4).map(amenity => (
                        <span key={amenity} className="text-[10px] font-bold text-c-grey-60 bg-c-black-06
                            border border-c-black-15 py-px px-[7px] rounded-full capitalize">
                            {amenity}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </Link>
);

const CinemasContent = () => {
    const [active, setActive] = useState("all");
    const [city, setCity] = useState("all");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);

    const params = useMemo(() => {
        const query = {};
        if (active !== "all") query.active = active;
        if (city !== "all") query.city = city;
        return query;
    }, [active, city]);

    const load = useCallback(async () => {
        try {
            setData(await fetchCinemas(params));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [params]);

    useEffect(() => { load(); }, [load]);

    //! the city list is derived from the venues themselves rather than fetched
    //! separately — every city with a cinema in it is, by definition, in here
    const [cities, setCities] = useState([]);
    useEffect(() => {
        if (data && city === "all" && active === "all") {
            setCities([...new Set(data.cinemas.map(c => c.city))].sort());
        }
    }, [data, city, active]);

    const cinemas = data?.cinemas || [];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Cinema" }]}
                title="Cinemas"
                subtitle={data
                    ? `${cinemas.length} venue${cinemas.length === 1 ? "" : "s"} · ${data.totals.halls} halls · ${data.totals.seats.toLocaleString("en-US")} seats · ${data.totals.cities} cities`
                    : "Loading venues"}
            >
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                        text-white hover:bg-c-red-45/85 duration-150"
                >
                    + New cinema
                </button>
            </PageHeader>

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3.5">
                    <Segmented
                        value={active}
                        onChange={setActive}
                        options={[
                            { id: "all", label: "All" },
                            { id: "true", label: "Open" },
                            { id: "false", label: "Closed" },
                        ]}
                    />
                    {cities.length > 1 && (
                        <select
                            aria-label="Filter by city"
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            className="bg-c-black-06 border border-c-black-20 rounded-[7px] py-1.5 px-2.5 text-xs
                                text-c-grey-90 outline-none focus:border-c-black-25 capitalize"
                        >
                            <option value="all">All cities</option>
                            {cities.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    )}
                </div>

                {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}

                {!data && !error && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="h-[232px] rounded-xl bg-c-black-10 border border-c-black-15 animate-pulse" />
                        ))}
                    </div>
                )}

                {data && cinemas.length === 0 && (
                    <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                        <div className="w-[46px] h-[46px] rounded-full bg-c-black-10 border border-c-black-15
                            flex items-center justify-center mx-auto mb-3.5 text-c-grey-65">
                            <HouseIcon className="w-5 h-5" />
                        </div>
                        <p className="text-c-grey-90 text-sm font-semibold mb-1">No venues here</p>
                        <p className="text-c-grey-60 text-[12.5px]">Nothing matches this filter.</p>
                    </div>
                )}

                {data && cinemas.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-3">
                        {cinemas.map(cinema => <CinemaCard key={cinema._id} cinema={cinema} />)}
                    </div>
                )}
            </div>

            {creating && (
                <CinemaDrawer
                    onClose={() => setCreating(false)}
                    onSaved={() => { setCreating(false); load(); }}
                />
            )}
        </>
    );
}

export default CinemasContent;
