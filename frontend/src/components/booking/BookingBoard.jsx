"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";

import DateStrip, { toDateKey } from "./DateStrip";
import ShowtimePicker from "./ShowtimePicker";
import SeatMap from "./SeatMap";
import SelectedTickets from "./SelectedTickets";
import HoldTimer from "./HoldTimer";
import { fetchShowtime, fetchShowtimesByMovie } from "@/services/CinemaService";
import { holdSeats } from "@/services/BookingService";
import useUserStore from "@/stores/useUserStore";

const MAX_SEATS = 10;

const BookingBoard = ({ movie, initialShowtimes }) => {
    const router = useRouter();
    const user = useUserStore(state => state.user);

    const [offset, setOffset] = useState(0);
    const [date, setDate] = useState(() => toDateKey(new Date()));
    const [cinemas, setCinemas] = useState(initialShowtimes?.cinemas || []);
    const [loadingTimes, setLoadingTimes] = useState(false);

    const [showtimeId, setShowtimeId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loadingSeats, setLoadingSeats] = useState(false);

    const [selected, setSelected] = useState([]);
    const [hold, setHold] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    //! reload the day's screenings whenever the chosen date changes
    useEffect(() => {
        let active = true;
        setLoadingTimes(true);

        fetchShowtimesByMovie(movie._id, { date })
            .then(data => {
                if (!active) return;
                setCinemas(data.cinemas || []);
                //! the previously chosen screening belongs to another day now
                setShowtimeId(null);
                setDetail(null);
                setSelected([]);
            })
            .finally(() => active && setLoadingTimes(false));

        return () => { active = false; };
    }, [movie._id, date]);

    //! load the seat map (and who already holds what) for the chosen screening
    useEffect(() => {
        if (!showtimeId) return;

        let active = true;
        setLoadingSeats(true);
        setSelected([]);

        fetchShowtime(showtimeId)
            .then(data => { if (active) setDetail(data); })
            .catch(() => active && toast.error("Couldn't load the seat map."))
            .finally(() => active && setLoadingSeats(false));

        return () => { active = false; };
    }, [showtimeId]);

    const pricing = detail?.showtime?.pricing;
    //! memoised so the `|| []` fallback doesn't hand back a new array each
    //! render and invalidate the seat index below every time
    const seatMap = useMemo(() => detail?.showtime?.hall?.seatMap || [], [detail]);

    const seatIndex = useMemo(() => {
        const index = new Map();
        for (const row of seatMap) {
            for (const seat of row.seats) index.set(`${row.row}${seat.number}`, seat);
        }
        return index;
    }, [seatMap]);

    const toggleSeat = useCallback((label) => {
        //! a live hold is already paid-for inventory; changing it would need a
        //! new hold, so make the user release this one first
        if (hold) return;

        setSelected(current => {
            const existing = current.find(seat => seat.label === label);
            if (existing) return current.filter(seat => seat.label !== label);

            if (current.length >= MAX_SEATS) {
                toast.info(`You can book at most ${MAX_SEATS} seats at a time.`);
                return current;
            }

            const seat = seatIndex.get(label);
            if (!seat) return current;

            return [...current, { label, tier: seat.tier, price: pricing?.[seat.tier] ?? 0 }];
        });
    }, [hold, seatIndex, pricing]);

    const total = selected.reduce((sum, seat) => sum + seat.price, 0);

    const releaseHold = useCallback(() => {
        setHold(null);
        setSelected([]);
        //! whoever picked up the released seats should now be visible
        if (showtimeId) fetchShowtime(showtimeId).then(setDetail).catch(() => { });
    }, [showtimeId]);

    const handleBuy = async () => {
        if (!user) {
            toast.info("Please log in to book seats.");
            return router.push("/register?page=login");
        }
        if (!selected.length || submitting) return;

        setSubmitting(true);
        try {
            const result = await holdSeats(showtimeId, selected.map(seat => seat.label));
            setHold(result.booking);
            router.push(`/booking/${result.booking._id}`);
        } catch (error) {
            //! losing a race is normal — show which seats went and refresh the map
            if (error.takenSeats?.length) {
                toast.error(`Just taken: ${error.takenSeats.join(", ")}. Please pick again.`);
                setSelected(current => current.filter(seat => !error.takenSeats.includes(seat.label)));
                fetchShowtime(showtimeId).then(setDetail).catch(() => { });
            } else {
                toast.error(error.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container py-6">
            <DateStrip
                selectedDate={date}
                onSelect={setDate}
                offset={offset}
                onOffsetChange={setOffset}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr] gap-5 items-start">

                <div className="flex flex-col gap-4">
                    {/*//! what you're booking */}
                    <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5">
                        <div className="flex gap-4">
                            <div className="w-[104px] shrink-0 aspect-thumbnail rounded-xl overflow-hidden bg-c-black-12 relative">
                                {movie.thumbnail && (
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${movie.thumbnail}`}
                                        alt={movie.title}
                                        width={208} height={234}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-extrabold text-white leading-tight mb-1">{movie.title}</h1>
                                <p className="text-c-grey-60 text-[13px]">
                                    {movie.duration ? `${Math.floor(movie.duration / 60)}hr ${movie.duration % 60}min` : null}
                                </p>
                            </div>
                        </div>

                        {detail?.showtime?.cinema && (
                            <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-c-black-15 text-c-grey-70 text-[13.5px]">
                                <span>
                                    <b className="text-c-grey-90 font-bold">{detail.showtime.cinema.name}</b>
                                    {" · "}{detail.showtime.cinema.city}
                                    {" — "}{detail.showtime.hall?.name} · {detail.showtime.hall?.screenType}
                                </span>
                            </div>
                        )}
                    </div>

                    {loadingTimes
                        ? <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5 text-c-grey-60 text-super-sm text-center">Loading screenings…</div>
                        : <ShowtimePicker cinemas={cinemas} selectedId={showtimeId} onSelect={setShowtimeId} />
                    }

                    {showtimeId && (
                        <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5">
                            <p className="flex items-center gap-[7px] text-xs font-bold text-c-grey-60 mb-3">
                                Selected Tickets
                            </p>

                            <SelectedTickets seats={selected} onRemove={toggleSeat} />

                            {hold && <HoldTimer expiresAt={hold.expiresAt} onExpire={releaseHold} />}

                            <div className="flex items-center justify-between gap-3.5 mt-[18px] pt-4 border-t border-c-black-15">
                                <span className="flex items-baseline gap-[7px] min-w-0">
                                    <span className="text-c-grey-60 text-[13.5px] font-bold">Total —</span>
                                    <span className="text-[25px] font-extrabold tabular-nums text-white">${total}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleBuy}
                                    disabled={!selected.length || submitting}
                                    className="shrink-0 bg-c-red-45 text-white rounded-full py-3 px-8 text-[14.5px] font-extrabold
                                               shadow-[0_8px_20px_-10px_rgba(229,0,0,0.9)] hover:bg-[#c40000] active:scale-[0.98]
                                               disabled:bg-c-black-12 disabled:text-c-grey-60 disabled:shadow-none disabled:cursor-not-allowed
                                               transition-all duration-150"
                                >
                                    {submitting ? "Holding…" : selected.length ? `Buy · ${selected.length} ${selected.length > 1 ? "tickets" : "ticket"}` : "Buy"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showtimeId ? (
                    loadingSeats || !detail
                        ? <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-16 text-center text-c-grey-60 text-super-sm">Loading seat map…</div>
                        : <SeatMap
                            seatMap={seatMap}
                            pricing={pricing}
                            bookedSeats={detail.bookedSeats || []}
                            selectedSeats={selected}
                            onToggle={toggleSeat}
                        />
                ) : (
                    <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-16 text-center">
                        <p className="text-c-grey-90 font-medium mb-1.5">Choose a screening</p>
                        <p className="text-c-grey-60 text-super-sm">Pick a date and time to see which seats are free.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingBoard;
