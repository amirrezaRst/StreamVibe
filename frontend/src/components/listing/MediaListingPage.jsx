"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SpinnerSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";

/**
 * The paged "see everything" listing behind /movies/trending-now,
 * /series/most-popular and the four others. All six were the same ninety lines
 * with a different service call and heading — near enough byte-identical that a
 * diff between two of them came back five lines long.
 *
 * Keeping one copy is not only tidier: each of the six carried its own copy of
 * the same two faults, and its own accidental drift (one set padded the page
 * `lg:py-20 py-12`, the other `py-20`; one primed the first fetch with the page
 * number and the other without).
 *
 * @param title    the pill heading, e.g. "Trending Movies Now"
 * @param fetchPage (page) => response — a paged service
 * @param itemsKey which array the response carries: "movies" or "series"
 * @param series   passed through to MovieCard so it links to the right route
 */
const MediaListingPage = ({ title, fetchPage, itemsKey, series = false }) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    //! React 18 StrictMode mounts twice in development; without this the first
    //! page is fetched — and appended — twice, so every card shows up in
    //! duplicate before you have touched anything
    const primed = useRef(false);

    const loadPage = useCallback(async (nextPage) => {
        setLoading(true);
        setFailed(false);

        try {
            const data = await fetchPage(nextPage);

            //! the services return [] on failure, so the array this wants may
            //! not be there at all — spreading it unguarded threw, and the
            //! throw was swallowed by the catch below, leaving the list frozen
            //! with no sign anything had gone wrong
            const batch = data?.[itemsKey];
            if (!Array.isArray(batch)) throw new Error(`Listing response had no ${itemsKey} array`);

            setItems((previous) => [...previous, ...batch]);
            setHasNextPage(Boolean(data?.pagination?.hasNextPage));
        } catch (error) {
            console.error(`Error fetching ${itemsKey}:`, error);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, [fetchPage, itemsKey]);

    useEffect(() => {
        if (primed.current) return;
        primed.current = true;
        loadPage(1);
    }, [loadPage]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        loadPage(next);
    };

    //! only the very first load owns the whole grid. Every later page keeps the
    //! cards already on screen and puts the skeletons underneath them — the old
    //! version hid everything behind `!loading`, so pressing Load More wiped
    //! the list you were reading and replaced it with placeholders
    const firstLoad = loading && items.length === 0;

    return (
        <main className="container lg:py-20 py-12">
            <div className="relative border border-c-black-15 rounded-xl xl:pt-8 xl:pb-10 pt-3 pb-10 lg:px-10 md:px-6 px-4">

                <h1
                    className="inline-flex absolute md:top-[-22.5px] top-[-19px] 3xl:text-super-base xl:text-base font-medium
                     text-super-sm items-center tracking-wide bg-c-red-45 text-white rounded-md px-6 md:h-[45px] h-[38px]"
                >
                    {title}
                </h1>

                <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-8 mt-10">
                    {items.map(({ _id, slug, title: itemTitle, duration, thumbnail, views, averageRating }) => (
                        <MovieCard
                            special
                            series={series}
                            key={_id}
                            id={slug || _id}
                            title={itemTitle}
                            image={thumbnail}
                            duration={duration}
                            view={views}
                            rate={averageRating}
                        />
                    ))}

                    {loading && Array.from({ length: firstLoad ? 12 : 4 }).map((_, index) => (
                        <MovieCardSkeleton special key={`skeleton-${index}`} />
                    ))}
                </div>

                {/*//! a failed load used to leave the page looking finished but
                    short — there has to be something that says otherwise */}
                {failed && !loading && (
                    <div className="flex flex-col items-center text-center mt-10">
                        <p className="text-c-grey-90 font-semibold text-sm mb-1">Couldn&apos;t load more</p>
                        <p className="text-c-grey-60 text-[13px] mb-4">
                            {items.length ? "The rest of the list didn't arrive." : "This list didn't load."}
                        </p>
                        <button
                            type="button"
                            onClick={() => loadPage(page)}
                            className="bg-c-black-10 hover:bg-c-black-12 border border-c-black-15 rounded-lg
                                py-2 px-5 text-super-sm text-c-grey-70 duration-200
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {hasNextPage && !failed && (
                    <div className="flex justify-center mt-10">
                        <button
                            onClick={loadMore}
                            className="bg-c-red-45 hover:bg-c-red-55 duration-200 text-white font-medium px-4 py-2 rounded-lg
                                flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            disabled={loading}
                        >
                            {loading ? "Loading" : "Load More"}
                            <div className={loading ? "block" : "hidden"} role="status">
                                <SpinnerSvg />
                                <span className="sr-only">Loading…</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};

export default MediaListingPage;
