"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
    addSpotlightSlide, fetchSpotlightSlides, removeSpotlightSlide,
    reorderSpotlightSlides, searchSpotlightCandidates, toggleSpotlightSlide,
} from "@/services/AdminService";
import { BannerIcon, SearchIcon } from "@/components/admin/AdminIcons";
import PageHeader from "@/components/admin/PageHeader";

const poster = (file) => file ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${file}` : null;

/**
 * A slide is nothing but a reference — kind, media id, order, active — so
 * there is no film data to author here, only which titles are on the
 * carousel, in what order, and whether each is currently live.
 */
const SpotlightContent = () => {
    const [slides, setSlides] = useState(null);
    const [error, setError] = useState(null);

    const [term, setTerm] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [searching, setSearching] = useState(false);

    const dragIndex = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const load = useCallback(async () => {
        try {
            const { slides } = await fetchSpotlightSlides();
            setSlides(slides);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    //! debounced the same way the command palette searches — a keystroke
    //! should not fire a request the next keystroke immediately obsoletes
    useEffect(() => {
        if (term.trim().length < 2) { setCandidates([]); setSearching(false); return; }

        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const { candidates } = await searchSpotlightCandidates(term.trim());
                setCandidates(candidates);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [term]);

    const onList = (mediaId) => slides?.some((slide) => slide.media?._id === mediaId);

    const handleAdd = async (candidate) => {
        try {
            const { slide } = await addSpotlightSlide(candidate.kind, candidate._id);
            setSlides((current) => [...current, slide]);
            toast.success(`Added ${candidate.title} to the spotlight`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleToggle = async (slide) => {
        const next = !slide.active;
        setSlides((current) => current.map((s) => (s._id === slide._id ? { ...s, active: next } : s)));
        try {
            await toggleSpotlightSlide(slide._id, next);
        } catch (err) {
            setSlides((current) => current.map((s) => (s._id === slide._id ? { ...s, active: !next } : s)));
            toast.error(err.message);
        }
    };

    const handleRemove = async (slide) => {
        const previous = slides;
        setSlides((current) => current.filter((s) => s._id !== slide._id));
        try {
            await removeSpotlightSlide(slide._id);
        } catch (err) {
            setSlides(previous);
            toast.error(err.message);
        }
    };

    const persistOrder = async (ordered) => {
        try {
            await reorderSpotlightSlides(ordered.map((slide) => slide._id));
        } catch (err) {
            toast.error(err.message);
            load();
        }
    };

    const move = (index, delta) => {
        const target = index + delta;
        if (!slides || target < 0 || target >= slides.length) return;

        const reordered = [...slides];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        setSlides(reordered);
        persistOrder(reordered);
    };

    const onDrop = (index) => {
        if (dragIndex.current === null || dragIndex.current === index) { setDragOverIndex(null); return; }

        const reordered = [...slides];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(index, 0, moved);
        setSlides(reordered);
        persistOrder(reordered);
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Catalog" }]}
                title="Spotlight"
                subtitle="What plays on the /explore hero carousel, and in what order."
            />

            <div className="p-[18px] grid grid-cols-12 gap-4">
                <section className="col-span-12 lg:col-span-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[13px] font-bold text-c-grey-90">Live order</h2>
                        <span className="text-[11.5px] text-c-grey-60">Drag to reorder</span>
                    </div>

                    {error && <p className="text-[12.5px] text-c-red-60">{error}</p>}

                    {slides === null ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-[62px] rounded-[10px] border border-c-black-15 bg-c-black-10 animate-pulse" />
                            ))}
                        </div>
                    ) : slides.length === 0 ? (
                        <div className="border border-dashed border-c-black-20 rounded-[10px] py-10 px-6 text-center">
                            <BannerIcon className="w-6 h-6 mx-auto mb-2.5 text-c-black-30" />
                            <p className="text-[12.5px] text-c-grey-60">
                                Nothing on the spotlight yet. Search the catalogue on the right to add a title.
                            </p>
                        </div>
                    ) : (
                        <ul className="list-none m-0 p-0 space-y-2">
                            {slides.map((slide, index) => (
                                <li
                                    key={slide._id}
                                    draggable
                                    onDragStart={() => { dragIndex.current = index; }}
                                    onDragOver={(event) => { event.preventDefault(); setDragOverIndex(index); }}
                                    onDragLeave={() => setDragOverIndex((current) => (current === index ? null : current))}
                                    onDrop={() => onDrop(index)}
                                    className={`flex items-center gap-3 bg-c-black-10 border rounded-[10px] py-2.5 px-3 duration-150
                                        ${dragOverIndex === index ? "border-c-red-45/60" : "border-c-black-15"}`}
                                >
                                    <span className="cursor-grab text-c-grey-60 select-none text-[13px] leading-none tracking-[2px]" aria-hidden="true">
                                        ⠿
                                    </span>
                                    <span className="w-5 text-center text-[10.5px] font-bold text-c-grey-60 tabular-nums shrink-0">
                                        {index + 1}
                                    </span>

                                    {/*//! dimming the whole row (text included) to signal
                                        "hidden" used to fail contrast on its own — a
                                        colour already close to the minimum, faded further,
                                        reads fine to the eye and fails to a checker. Only the
                                        poster (decorative) dims now; the title stays legible
                                        and the toggle plus the badge below carry the state. */}
                                    {poster(slide.media?.thumbnail) ? (
                                        <Image
                                            src={poster(slide.media.thumbnail)}
                                            alt=""
                                            width={68}
                                            height={96}
                                            className={`w-[34px] h-[48px] rounded-[5px] object-cover shrink-0 duration-150 ${!slide.active ? "opacity-40" : ""}`}
                                        />
                                    ) : (
                                        <span className="w-[34px] h-[48px] rounded-[5px] bg-c-black-15 shrink-0" />
                                    )}

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[12.5px] font-bold text-c-grey-97 truncate capitalize">
                                            {slide.media?.title || "Deleted title"}
                                        </span>
                                        <span className="block text-[10.5px] text-c-grey-60">
                                            {slide.kind === "Series" ? "Series" : "Movie"}
                                            {!slide.active && <span className="text-c-grey-60"> · Hidden</span>}
                                        </span>
                                    </span>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => move(index, -1)}
                                            disabled={index === 0}
                                            aria-label="Move up"
                                            className="w-[26px] h-[26px] rounded-[6px] bg-c-black-12 border border-c-black-20 text-c-grey-60
                                                flex items-center justify-center disabled:opacity-30 hover:text-c-grey-90 duration-150"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(index, 1)}
                                            disabled={index === slides.length - 1}
                                            aria-label="Move down"
                                            className="w-[26px] h-[26px] rounded-[6px] bg-c-black-12 border border-c-black-20 text-c-grey-60
                                                flex items-center justify-center disabled:opacity-30 hover:text-c-grey-90 duration-150"
                                        >
                                            ↓
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={slide.active}
                                        aria-label={slide.active ? "Live on /explore — click to hide" : "Hidden from /explore — click to show"}
                                        title={slide.active ? "Live on /explore" : "Hidden from /explore"}
                                        onClick={() => handleToggle(slide)}
                                        className={`w-[30px] h-[17px] rounded-full relative shrink-0 duration-200
                                            ${slide.active ? "bg-[#3DA872]" : "bg-c-black-20"}`}
                                    >
                                        <span
                                            className={`absolute top-[2px] w-[13px] h-[13px] rounded-full bg-white duration-200
                                                ${slide.active ? "right-[2px]" : "left-[2px]"}`}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(slide)}
                                        aria-label={`Remove ${slide.media?.title || "this title"} from the spotlight`}
                                        className="w-[26px] h-[26px] rounded-[6px] bg-c-black-12 border border-c-black-20 text-c-grey-60
                                            flex items-center justify-center hover:text-c-red-60 hover:border-c-red-45/40 duration-150 shrink-0"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <aside className="col-span-12 lg:col-span-4">
                    <h2 className="text-[13px] font-bold text-c-grey-90 mb-3">Add to spotlight</h2>

                    <div className="flex items-center gap-2 bg-c-black-10 border border-c-black-20 rounded-[8px] py-2.5 px-3 mb-3">
                        <SearchIcon className="w-3.5 h-3.5 text-c-black-30 shrink-0" />
                        <input
                            value={term}
                            onChange={(event) => setTerm(event.target.value)}
                            placeholder="Search movies and series…"
                            className="bg-transparent flex-1 text-[12.5px] text-c-grey-90 placeholder:text-c-black-30 outline-none min-w-0"
                        />
                        {searching && (
                            <span className="w-3 h-3 rounded-full border-2 border-c-black-20 border-t-c-red-45 animate-spin shrink-0" />
                        )}
                    </div>

                    {term.trim().length >= 2 && !searching && candidates.length === 0 && (
                        <p className="text-[12px] text-c-grey-60 px-1">No matches.</p>
                    )}

                    <ul className="list-none m-0 p-0 space-y-0.5">
                        {candidates.map((candidate) => {
                            const already = onList(candidate._id);
                            return (
                                <li key={candidate._id} className="flex items-center gap-2.5 py-1.5 px-1.5 rounded-[8px] hover:bg-c-black-10 duration-150">
                                    {poster(candidate.thumbnail) ? (
                                        <Image
                                            src={poster(candidate.thumbnail)}
                                            alt=""
                                            width={56}
                                            height={80}
                                            className="w-7 h-10 rounded object-cover shrink-0"
                                        />
                                    ) : (
                                        <span className="w-7 h-10 rounded bg-c-black-15 shrink-0" />
                                    )}
                                    <span className="min-w-0 flex-1 text-[12px] font-semibold text-c-grey-90 truncate capitalize">
                                        {candidate.title}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={already}
                                        onClick={() => handleAdd(candidate)}
                                        className="text-[10.5px] font-bold rounded-[6px] px-2.5 py-1 shrink-0 duration-150
                                            disabled:opacity-40 disabled:cursor-default
                                            text-c-red-60 bg-c-red-45/[0.1] border border-c-red-45/[0.24] hover:bg-c-red-45/[0.18]"
                                    >
                                        {already ? "Added" : "Add"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>
            </div>
        </>
    );
}

export default SpotlightContent;
