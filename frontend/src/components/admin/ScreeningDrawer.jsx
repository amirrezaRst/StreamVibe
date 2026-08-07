"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { createShowtime, createShowtimeRun, deleteShowtime } from "@/services/AdminService";
import { TIERS } from "./seatTiers";

const TURNAROUND_MINUTES = 15;

const timeOf = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
const clock = (date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const Field = ({ label, hint, children }) => (
    <label className="block mb-3">
        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">{label}</span>
        {children}
        {hint && <span className="block text-[11px] text-c-grey-55 mt-1 leading-snug">{hint}</span>}
    </label>
);

const control = `w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5
    text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25`;

/**
 * Scheduling a screening. The end time is not a field — it is the film's
 * runtime added to the start — and the clash check that runs here is the same
 * one the API runs, so the form never offers a save that will come back refused.
 */
const ScreeningDrawer = ({ halls, movies, showtimes, preset, editing, onClose, onSaved }) => {
    const [movieId, setMovieId] = useState(editing?.movie?._id || movies[0]?._id || "");
    const [hallId, setHallId] = useState(editing ? String(editing.hall) : preset?.hall?._id || halls[0]?._id || "");
    const [date, setDate] = useState(() => {
        const at = editing ? new Date(editing.startsAt) : preset?.at || new Date();
        return at.toISOString().slice(0, 10);
    });
    const [time, setTime] = useState(() => {
        const at = editing ? new Date(editing.startsAt) : preset?.at || new Date();
        return timeOf(at);
    });
    const [language, setLanguage] = useState(editing?.language || "original");
    const [repeat, setRepeat] = useState("once");
    const [occurrences, setOccurrences] = useState(7);
    const [pricing, setPricing] = useState(() => editing?.pricing || { standard: 12, premium: 18, vip: 26 });
    const [saving, setSaving] = useState(false);

    const movie = movies.find(m => String(m._id) === String(movieId));
    const hall = halls.find(h => String(h._id) === String(hallId));

    const startsAt = useMemo(() => new Date(`${date}T${time}`), [date, time]);
    const endsAt = useMemo(
        () => (movie ? new Date(startsAt.getTime() + movie.duration * 60000) : null),
        [startsAt, movie]
    );
    const freeAt = endsAt ? new Date(endsAt.getTime() + TURNAROUND_MINUTES * 60000) : null;

    //! only the tiers this hall actually has — a hall with no VIP seats should
    //! not be asked for a VIP price, and the API refuses one it did not need
    const neededTiers = useMemo(
        () => TIERS.filter(tier => (hall?.tiers?.[tier.id] || 0) > 0),
        [hall]
    );

    /**
     * The same rule the server applies: two screenings collide when one starts
     * before the other has cleared the room, turnaround included.
     */
    const clash = useMemo(() => {
        if (!endsAt || !hallId) return null;

        const mine = showtimes.filter(s =>
            String(s.hall) === String(hallId) && String(s._id) !== String(editing?._id));

        return mine.find(other => {
            const otherEnd = new Date(other.endsAt).getTime() + TURNAROUND_MINUTES * 60000;
            const myEnd = endsAt.getTime() + TURNAROUND_MINUTES * 60000;
            return startsAt.getTime() < otherEnd && new Date(other.startsAt).getTime() < myEnd;
        }) || null;
    }, [showtimes, hallId, startsAt, endsAt, editing]);

    const missingPrice = neededTiers.find(tier => !pricing[tier.id] && pricing[tier.id] !== 0);
    const blocked = Boolean(clash) || Boolean(missingPrice) || !movie || !hall;

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                movie: movieId,
                hall: hallId,
                startsAt: startsAt.toISOString(),
                language,
                //! only what this hall needs, so an unused tier price is never sent
                pricing: Object.fromEntries(neededTiers.map(tier => [tier.id, Number(pricing[tier.id])])),
            };

            const result = repeat === "once"
                ? await createShowtime(payload)
                : await createShowtimeRun({ ...payload, repeat, occurrences: Number(occurrences) });

            toast.success(result.message || "Scheduled");
            onSaved();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`Remove this screening of “${editing.movie?.title}”? Any seats already booked for it will need refunding separately.`)) return;

        setSaving(true);
        try {
            await deleteShowtime(editing._id);
            toast.success("Screening removed");
            onSaved();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    //! Escape closes, the way every other overlay in the console does
    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-c-black-06/60 flex justify-end z-50" onClick={onClose}>
            <div
                className="w-full max-w-[440px] bg-c-black-10 border-s border-c-black-20 flex flex-col h-full"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center gap-2.5 py-3 px-4 border-b border-c-black-15">
                    <h2 className="text-[14.5px] font-extrabold flex-1">
                        {editing ? "Screening" : "New screening"}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    <Field label="Film">
                        <select className={control} value={movieId} onChange={(e) => setMovieId(e.target.value)} disabled={!!editing}>
                            {movies.map(m => (
                                <option key={m._id} value={m._id}>
                                    {m.title} · {Math.floor(m.duration / 60)}h {m.duration % 60}m
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Hall">
                        <select className={control} value={hallId} onChange={(e) => setHallId(e.target.value)} disabled={!!editing}>
                            {halls.map(h => (
                                <option key={h._id} value={h._id}>
                                    {h.name} · {h.screenType} · {h.totalSeats} seats
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Date">
                            <input type="date" className={control} value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        <Field label="Starts">
                            <input type="time" className={control} value={time} onChange={(e) => setTime(e.target.value)} />
                        </Field>
                    </div>

                    {endsAt && (
                        <div className={`flex gap-2 items-start rounded-lg py-2.5 px-3 mb-3 text-[11.5px] leading-relaxed
                            ${clash
                                ? "bg-c-red-45/[0.12] border border-c-red-45/35 text-c-red-80"
                                : "bg-[#4C8DD9]/[0.14] border border-[#4C8DD9]/30 text-[#7CADEA]"}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" className="shrink-0 mt-px">
                                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                            {clash ? (
                                <span>
                                    <b>{hall?.name} is busy.</b> “{clash.movie?.title}” runs from {clock(new Date(clash.startsAt))} to{" "}
                                    {clock(new Date(clash.endsAt))}, and the room is not free again until {TURNAROUND_MINUTES} minutes after that.
                                </span>
                            ) : (
                                <span>
                                    Ends <b>{clock(endsAt)}</b>, free again at <b>{clock(freeAt)}</b> after the{" "}
                                    {TURNAROUND_MINUTES}-minute turnaround. The hall is clear.
                                </span>
                            )}
                        </div>
                    )}

                    <Field label="Language">
                        <select className={control} value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="original">Original</option>
                            <option value="subtitled">Subtitled</option>
                            <option value="dubbed">Dubbed</option>
                        </select>
                    </Field>

                    <div className="mb-3">
                        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">Price per tier</span>
                        {neededTiers.length === 0 ? (
                            <p className="text-[11.5px] text-[#E8B663] bg-[#D99A34]/[0.14] border border-[#D99A34]/30
                                rounded-lg py-2 px-2.5 leading-relaxed">
                                This hall has no seat map yet, so nothing can be priced or sold in it.
                            </p>
                        ) : neededTiers.map(tier => (
                            <div key={tier.id} className="grid grid-cols-[1fr_92px] gap-2 items-center mb-1.5">
                                <span className="flex items-center gap-2 text-xs text-c-grey-65">
                                    <i className="w-3 h-[11px] rounded-sm shrink-0" style={{ background: tier.fill }} />
                                    {tier.label}
                                    <span className="text-[11px] text-c-grey-55">· {hall.tiers[tier.id]} seats</span>
                                </span>
                                <input
                                    type="number" min="0" step="0.5"
                                    className={`${control} tabular-nums`}
                                    value={pricing[tier.id] ?? ""}
                                    onChange={(e) => setPricing(p => ({ ...p, [tier.id]: e.target.value }))}
                                />
                            </div>
                        ))}
                        {missingPrice && (
                            <p className="text-[11px] text-c-red-80 mt-1.5">
                                {missingPrice.label} seats exist in this hall — without a price they cannot be sold.
                            </p>
                        )}
                    </div>

                    {!editing && (
                        <>
                            <Field
                                label="Repeat"
                                hint="A film opens for a week and gets the same slot every day. Every occurrence is checked before any of them are created — if one collides, none are."
                            >
                                <select className={control} value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                                    <option value="once">Just this one</option>
                                    <option value="daily">Every day</option>
                                    <option value="weekly">Same day each week</option>
                                </select>
                            </Field>

                            {repeat !== "once" && (
                                <Field label={repeat === "daily" ? "How many days" : "How many weeks"}>
                                    <input
                                        type="number" min="2" max="60"
                                        className={`${control} tabular-nums`}
                                        value={occurrences}
                                        onChange={(e) => setOccurrences(e.target.value)}
                                    />
                                </Field>
                            )}
                        </>
                    )}
                </div>

                <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                    {!editing && (
                        <button
                            type="button" onClick={save} disabled={blocked || saving}
                            className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                                text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? "Scheduling…" : repeat === "once" ? "Schedule it" : `Schedule ${occurrences}`}
                        </button>
                    )}
                    <button type="button" onClick={onClose}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-black-20
                            bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">
                        {editing ? "Close" : "Cancel"}
                    </button>
                    {editing && (
                        <button type="button" onClick={remove} disabled={saving}
                            className="ms-auto rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-red-45/35
                                text-c-red-80 hover:bg-c-red-45/[0.12] duration-150 disabled:opacity-40">
                            Remove
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

export default ScreeningDrawer;
