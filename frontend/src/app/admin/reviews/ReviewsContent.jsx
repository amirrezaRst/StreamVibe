"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
    deleteReview, fetchReviews, moderateReview, moderateReviews, setReviewSpoiler,
} from "@/services/AdminService";
import PageHeader from "@/components/admin/PageHeader";
import ReviewQueueRow from "@/components/admin/ReviewQueueRow";

const TABS = [
    { id: "pending", label: "Pending", params: { status: "pending" } },
    { id: "reported", label: "Reported", params: { reported: "true" } },
    { id: "approved", label: "Approved", params: { status: "approved" } },
    { id: "rejected", label: "Rejected", params: { status: "rejected" } },
];

const Skeleton = () => (
    <div className="flex flex-col gap-px">
        {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-[76px] bg-c-black-10 border border-c-black-15 rounded animate-pulse" />
        ))}
    </div>
);

const ReviewsContent = () => {
    const [tab, setTab] = useState("pending");
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [cursor, setCursor] = useState(0);
    const [busy, setBusy] = useState(false);

    //! a response for a tab the user has already left would paint the wrong list
    const requested = useRef(tab);

    const load = useCallback(async (which, term) => {
        requested.current = which;
        try {
            const params = { ...TABS.find(t => t.id === which).params, limit: 50 };
            if (term) params.search = term;

            const result = await fetchReviews(params);
            if (requested.current !== which) return;

            setData(result);
            setError(null);
            setSelected(new Set());
            setCursor(0);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        setData(null);
        load(tab, search);
    }, [tab, load]);

    //! typing should not fire a request per keystroke
    useEffect(() => {
        const timer = setTimeout(() => load(tab, search), 350);
        return () => clearTimeout(timer);
    }, [search, tab, load]);

    const reviews = data?.reviews || [];
    const counts = data?.counts;

    const toggle = (id) => setSelected(current => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const allSelected = reviews.length > 0 && selected.size === reviews.length;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(reviews.map(r => r._id)));

    const runOne = async (review, status) => {
        setBusy(true);
        try {
            const reason = status === "rejected"
                ? window.prompt("Why is this being rejected? (optional, shown to nobody but you)") || undefined
                : undefined;

            await moderateReview(review._id, status, reason);
            toast.success(status === "approved" ? "Review published" : `Review ${status}`);
            await load(tab, search);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const runMany = async (status) => {
        if (!selected.size) return;

        setBusy(true);
        try {
            const result = await moderateReviews([...selected], status);
            toast.success(result.message);
            await load(tab, search);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const clearSpoiler = async (review) => {
        setBusy(true);
        try {
            await setReviewSpoiler(review._id, false);
            toast.success("Spoiler warning removed");
            await load(tab, search);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const remove = async (review) => {
        if (!window.confirm(`Delete ${review.fullName}'s review? This cannot be undone.`)) return;

        setBusy(true);
        try {
            await deleteReview(review._id);
            toast.success("Review removed");
            await load(tab, search);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    /**
     * Keyboard moderation. The queue is the part of this job that wears people
     * down, and reaching for the mouse for every row is most of why. J and K
     * walk it, A and R decide, X selects — so a full queue can be cleared
     * without leaving the home row.
     */
    useEffect(() => {
        const onKey = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            //! never steal a keystroke meant for the search box
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
            if (!reviews.length || busy) return;

            const current = reviews[cursor];

            switch (event.key.toLowerCase()) {
                case "j":
                    event.preventDefault();
                    setCursor(i => Math.min(i + 1, reviews.length - 1));
                    break;
                case "k":
                    event.preventDefault();
                    setCursor(i => Math.max(i - 1, 0));
                    break;
                case "x":
                    event.preventDefault();
                    if (current) toggle(current._id);
                    break;
                case "a":
                    event.preventDefault();
                    if (selected.size) runMany("approved");
                    else if (current && current.status === "pending") runOne(current, "approved");
                    break;
                case "r":
                    event.preventDefault();
                    if (selected.size) runMany("rejected");
                    else if (current && current.status === "pending") runOne(current, "rejected");
                    break;
                default:
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [reviews, cursor, selected, busy, tab, search]);

    //! keep the focused row on screen as J walks past the fold
    useEffect(() => {
        const rows = document.querySelectorAll("[data-review-row]");
        rows[cursor]?.scrollIntoView({ block: "nearest" });
    }, [cursor]);

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Community" }]}
                title="Reviews"
                subtitle={counts
                    ? `${counts.pending} waiting · ${counts.reported} flagged by readers · ${counts.approved} published`
                    : "Loading the queue"}
            />

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <div className="inline-flex bg-c-black-10 border border-c-black-20 rounded-lg p-0.5 gap-0.5">
                        {TABS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                aria-pressed={tab === id}
                                className={`text-xs font-bold py-[5px] px-[13px] rounded-md duration-150
                                    ${tab === id ? "bg-c-red-45/[0.12] text-c-red-80" : "text-c-grey-60 hover:text-c-grey-90"}`}
                            >
                                {label}
                                {counts && <span className="opacity-70 ms-1">{counts[id]}</span>}
                            </button>
                        ))}
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search text or reviewer"
                        className="bg-c-black-06 border border-c-black-20 rounded-[7px] py-1.5 px-3 text-xs
                            text-c-grey-90 placeholder:text-c-black-30 focus:border-c-black-25 outline-none w-[210px]"
                    />

                    <span className="ms-auto text-[11px] text-c-black-30 hidden md:block">
                        <b className="text-c-grey-65">J</b>/<b className="text-c-grey-65">K</b> move ·
                        <b className="text-c-grey-65 ms-1.5">X</b> select ·
                        <b className="text-c-grey-65 ms-1.5">A</b> approve ·
                        <b className="text-c-grey-65 ms-1.5">R</b> reject
                    </span>
                </div>

                {selected.size > 0 && (
                    <div className="flex items-center gap-2.5 bg-c-red-45/[0.12] border border-c-red-45/30 rounded-lg py-2 px-3 mb-2.5 text-xs">
                        <button type="button" onClick={toggleAll} className="font-extrabold text-c-red-80">
                            {selected.size} selected
                        </button>
                        <div className="ms-auto flex gap-2">
                            <button
                                type="button" onClick={() => runMany("approved")} disabled={busy}
                                className="rounded-[7px] py-1.5 px-3 font-bold border border-[#3DA872]/35 bg-[#3DA872]/[0.14] text-[#6FCB9C] disabled:opacity-50"
                            >
                                Approve {selected.size}
                            </button>
                            <button
                                type="button" onClick={() => runMany("rejected")} disabled={busy}
                                className="rounded-[7px] py-1.5 px-3 font-bold border border-c-red-45/35 bg-c-red-45/[0.12] text-c-red-80 disabled:opacity-50"
                            >
                                Reject {selected.size}
                            </button>
                            <button type="button" onClick={() => setSelected(new Set())} className="text-c-grey-60 px-2">
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {!data && !error && <Skeleton />}
                {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}

                {data && reviews.length === 0 && (
                    <div className="border border-dashed border-c-black-20 rounded-xl py-10 text-center">
                        <p className="text-c-grey-90 text-sm font-semibold mb-1">
                            {search ? `Nothing matches “${search}”` : "Nothing here"}
                        </p>
                        <p className="text-c-grey-60 text-[12.5px]">
                            {tab === "pending" ? "The queue is empty — every review has been looked at." : "No reviews in this state."}
                        </p>
                    </div>
                )}

                {data && reviews.length > 0 && (
                    <div className="border border-c-black-15 rounded-[10px] overflow-hidden bg-c-black-10">
                        <div className="flex items-center gap-3 py-2 px-3.5 bg-c-black-12 border-b border-c-black-15">
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-[11px] font-bold text-c-grey-60 hover:text-c-grey-90 duration-150"
                            >
                                {allSelected ? "Deselect all" : `Select all ${reviews.length} on this page`}
                            </button>
                        </div>

                        {reviews.map((review, index) => (
                            <ReviewQueueRow
                                key={review._id}
                                review={review}
                                selected={selected.has(review._id)}
                                focused={index === cursor}
                                busy={busy}
                                onToggleSelect={() => toggle(review._id)}
                                onModerate={(status) => runOne(review, status)}
                                onSpoiler={() => clearSpoiler(review)}
                                onDelete={() => remove(review)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default ReviewsContent;
