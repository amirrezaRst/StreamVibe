"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { SpinnerSvg } from "@/assets/Svgs";
import { fetchActors } from "@/services/ActorService";
import { fetchDirectors } from "@/services/DirectorService";
import { fetchMusicians } from "@/services/MusicianService";
import PersonCard from "./PersonCard";
import PersonCardSkeleton from "./PersonCardSkeleton";
import { ROLES } from "./personRoles";

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 250;

//! page.jsx stays a server component (it exports metadata for indexing), so
//! this client component resolves its own fetcher from the role rather than
//! taking one as a prop — functions aren't serialisable across that boundary
const FETCHERS = { actor: fetchActors, director: fetchDirectors, musician: fetchMusicians };

//! Actors / Directors / Composers — real navigation between the three
//! index routes, not a client-side toggle, so each stays a proper page
const RoleSwitch = ({ active }) => (
    <div className="inline-flex items-center gap-1 bg-c-black-10 border border-c-black-15 rounded-xl p-1 mb-5" role="tablist" aria-label="Browse by role">
        {Object.entries(ROLES).map(([key, role]) => {
            const RoleIcon = role.Icon;
            const isActive = key === active;
            return (
                <Link
                    key={key}
                    href={`/${role.segment}`}
                    role="tab"
                    aria-selected={isActive}
                    className={`flex items-center gap-1.5 text-[12.5px] font-bold rounded-lg px-4 py-1.5 duration-150
                        ${isActive ? "bg-c-red-45 text-white" : "text-c-grey-60 hover:text-c-grey-90 hover:bg-c-black-12"}`}
                >
                    <RoleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {role.label}s
                </Link>
            );
        })}
    </div>
);

const PeopleBrowser = ({ roleKey }) => {
    const role = ROLES[roleKey];
    const fetchPeople = FETCHERS[roleKey];
    const title = `${role.label}s`;

    const [people, setPeople] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [total, setTotal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [term, setTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");

    const mountFetchRan = useRef(false);
    const searchIsFirstRun = useRef(true);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(term.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [term]);

    const load = useCallback(async (targetPage, search, replace) => {
        setLoading(true);
        //! a fresh page 1 (mount, or a new search term) clears the grid up
        //! front instead of leaving stale cards sitting above the incoming
        //! skeletons until the response lands
        if (replace) setPeople([]);
        try {
            //! fetchActors/fetchDirectors/fetchMusicians already log and
            //! swallow network errors, resolving to undefined rather than
            //! rejecting — a crash here would take the whole page down
            const data = await fetchPeople(targetPage, search);
            if (!data?.people || !data?.pagination) throw new Error("No data returned");

            setPeople((prev) => (replace ? data.people : [...prev, ...data.people]));
            setHasNextPage(data.pagination.hasNextPage);
            setTotal(data.pagination.total);
            setPage(targetPage);
            setError(false);
        } catch (err) {
            console.error(`Error fetching ${title.toLowerCase()}:`, err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [fetchPeople, title]);

    //! React 18 strict mode double-invokes effects in dev; this survives that
    //! the same way the /movies/genres page's own initial fetch does
    useEffect(() => {
        if (mountFetchRan.current === false) {
            load(1, "", true);
            return () => { mountFetchRan.current = true; };
        }
    }, [load]);

    useEffect(() => {
        if (searchIsFirstRun.current) { searchIsFirstRun.current = false; return; }
        load(1, debouncedTerm, true);
    }, [debouncedTerm, load]);

    const loadMore = () => load(page + 1, debouncedTerm, false);

    const showError = error && !loading && people.length === 0;
    const showEmpty = !showError && !loading && people.length === 0;
    const skeletonCount = people.length === 0 ? 12 : PAGE_SIZE;

    return (
        <main className="container lg:py-16 py-10">
            <RoleSwitch active={roleKey} />

            <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
                <div>
                    <h1 className="text-white text-3xl font-extrabold tracking-tight">{title}</h1>
                    <p className="mt-1.5 text-c-grey-60 text-sm">
                        {debouncedTerm
                            ? `${people.length}${hasNextPage ? "+" : ""} of ${total ?? "…"} ${title.toLowerCase()} match "${debouncedTerm}"`
                            : `${total ?? "…"} ${title.toLowerCase()} in the StreamVibe catalogue`}
                    </p>
                </div>

                <div className="relative w-full sm:w-80">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-4 h-4 text-c-grey-60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        placeholder="Search by name…"
                        aria-label={`Search ${title.toLowerCase()}`}
                        className="w-full bg-c-black-10 border border-c-black-15 rounded-xl py-3 pl-10 pr-3.5 text-c-grey-97 text-sm
                            placeholder:text-c-grey-60 outline-none duration-150 focus:border-c-red-45 focus:bg-c-black-12"
                    />
                </div>
            </div>

            {showError ? (
                <div className="flex flex-col items-center text-center py-24">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-8 h-8 text-c-black-25 mb-3.5" aria-hidden="true">
                        <path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17.1a1.5 1.5 0 001.3 2.25h16a1.5 1.5 0 001.3-2.25L13.7 3.9a1.5 1.5 0 00-2.6 0z" />
                    </svg>
                    <p className="text-c-grey-90 font-semibold text-sm mb-1">Couldn&apos;t load {title.toLowerCase()}</p>
                    <p className="text-c-grey-60 text-[13px] mb-4">Check your connection and try again.</p>
                    <button
                        onClick={() => load(1, debouncedTerm, true)}
                        className="bg-c-black-12 border border-c-black-20 text-c-grey-90 text-[12.5px] font-bold rounded-lg px-4 py-2 hover:border-c-red-45/50 duration-150"
                    >
                        Retry
                    </button>
                </div>
            ) : showEmpty ? (
                <div className="flex flex-col items-center text-center py-24">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-8 h-8 text-c-black-25 mb-3.5" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <p className="text-c-grey-90 font-semibold text-sm mb-1">No one matches that search</p>
                    <p className="text-c-grey-60 text-[13px]">Try a different spelling, or clear the search to see everyone.</p>
                </div>
            ) : (
                <div className="grid 2xl:grid-cols-7 xl:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-x-4 gap-y-6">
                    {people.map((person) => (
                        <PersonCard key={person._id} person={person} segment={role.segment} />
                    ))}
                    {loading && Array.from({ length: skeletonCount }).map((_, i) => (
                        <PersonCardSkeleton key={`sk-${i}`} delay={(i % 7) * 120} />
                    ))}
                </div>
            )}

            {!showError && !showEmpty && hasNextPage && (
                <div className="flex justify-center mt-10">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="bg-c-red-45 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        {loading ? "Loading" : "Load More"}
                        <div className={loading ? "block" : "hidden"} role="status">
                            <SpinnerSvg />
                            <span className="sr-only">Loading...</span>
                        </div>
                    </button>
                </div>
            )}
        </main>
    );
}

export default PeopleBrowser;
