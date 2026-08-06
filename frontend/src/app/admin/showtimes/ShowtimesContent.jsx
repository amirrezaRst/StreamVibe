"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCinemas, fetchSchedulableMovies, fetchSchedule } from "@/services/AdminService";
import PageHeader from "@/components/admin/PageHeader";
import ScheduleGrid from "@/components/admin/ScheduleGrid";
import ScreeningDrawer from "@/components/admin/ScreeningDrawer";

const isoDay = (date) => date.toISOString().slice(0, 10);
const shift = (day, days) => {
    const next = new Date(`${day}T12:00:00`);
    next.setDate(next.getDate() + days);
    return isoDay(next);
};

const longDate = (day) => new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
});

const ShowtimesContent = () => {
    const [cinemas, setCinemas] = useState([]);
    const [cinemaId, setCinemaId] = useState("");
    const [day, setDay] = useState(() => isoDay(new Date()));
    const [movies, setMovies] = useState([]);

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [drawer, setDrawer] = useState(null);

    useEffect(() => {
        Promise.all([fetchCinemas({ active: "true" }), fetchSchedulableMovies()])
            .then(([venues, films]) => {
                setCinemas(venues.cinemas);
                setMovies(films.movies);
                if (venues.cinemas.length) setCinemaId(venues.cinemas[0]._id);
            })
            .catch(err => setError(err.message));
    }, []);

    const load = useCallback(async () => {
        if (!cinemaId) return;

        try {
            setData(await fetchSchedule({ cinema: cinemaId, date: day }));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [cinemaId, day]);

    useEffect(() => {
        setData(null);
        load();
    }, [load]);

    const halls = data?.halls || [];
    const showtimes = data?.showtimes || [];

    //! clicking an empty cell opens the form with that hall and hour already
    //! chosen — the two fields somebody would otherwise have to re-enter
    const pickSlot = (hall, hour) => {
        const at = new Date(`${day}T12:00:00`);
        at.setHours(hour, 0, 0, 0);
        setDrawer({ preset: { hall, at } });
    };

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Cinema" }]}
                title={data?.cinema?.name || "Showtimes"}
                subtitle={data
                    ? `${longDate(day)} · ${halls.length} halls · ${data.summary.screenings} screenings · ${data.summary.averageOccupancy}% average fill`
                    : "Loading the schedule"}
            >
                <button type="button" onClick={() => setDay(d => shift(d, -1))} aria-label="Previous day"
                    className="rounded-[7px] py-[7px] px-2.5 text-[12.5px] font-bold border border-c-black-20
                        bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">‹</button>
                <button type="button" onClick={() => setDay(isoDay(new Date()))}
                    className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold border border-c-black-20
                        bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">Today</button>
                <button type="button" onClick={() => setDay(d => shift(d, 1))} aria-label="Next day"
                    className="rounded-[7px] py-[7px] px-2.5 text-[12.5px] font-bold border border-c-black-20
                        bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">›</button>

                <select
                    value={cinemaId}
                    onChange={(event) => setCinemaId(event.target.value)}
                    className="bg-c-black-10 border border-c-black-20 rounded-[7px] py-[7px] px-2.5 text-[12.5px]
                        font-bold text-c-grey-90 outline-none focus:border-c-black-25 capitalize"
                >
                    {cinemas.map(cinema => (
                        <option key={cinema._id} value={cinema._id}>{cinema.name}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={() => setDrawer({ preset: null })}
                    disabled={!halls.length || !movies.length}
                    className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                        text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40"
                >
                    + Screening
                </button>
            </PageHeader>

            <div className="p-[18px]">
                {error && <p className="text-c-grey-60 text-super-sm mb-3">{error}</p>}

                {!data && !error && (
                    <div className="h-[280px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
                )}

                {data && halls.length === 0 && (
                    <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                        <p className="text-c-grey-90 text-sm font-semibold mb-1">This venue has no halls</p>
                        <p className="text-c-grey-60 text-[12.5px]">Nothing can be scheduled until it does.</p>
                    </div>
                )}

                {data && halls.length > 0 && (
                    <>
                        <ScheduleGrid
                            halls={halls}
                            showtimes={showtimes}
                            onPick={pickSlot}
                            onOpen={(showtime) => setDrawer({ editing: showtime })}
                        />

                        <div className="flex gap-4 flex-wrap text-[11px] text-c-grey-60 mt-3">
                            <span className="flex items-center gap-1.5">
                                <i className="w-3.5 h-[3px] rounded-sm bg-[#3DA872] block" /> Fill along the bottom edge
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="w-3.5 h-2.5 rounded-sm block border border-c-black-20"
                                    style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,.12) 3px,rgba(255,255,255,.12) 6px)" }} />
                                15-minute turnaround
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="w-3.5 h-2.5 rounded-sm block border border-dashed border-c-red-60"
                                    style={{ background: "rgba(229,0,0,0.3)" }} />
                                Collision
                            </span>
                            <span className="ms-auto text-c-black-30">
                                Click an empty slot to schedule something there.
                            </span>
                        </div>
                    </>
                )}
            </div>

            {drawer && (
                <ScreeningDrawer
                    halls={halls}
                    movies={movies}
                    showtimes={showtimes}
                    preset={drawer.preset}
                    editing={drawer.editing}
                    onClose={() => setDrawer(null)}
                    onSaved={() => { setDrawer(null); load(); }}
                />
            )}
        </>
    );
}

export default ShowtimesContent;
