"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SpinnerSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";

/**
 * The paginated "see all" page behind each credits carousel, shared by all
 * three roles and both credit kinds.
 *
 * It replaces six copies of the same file. Those copies had drifted: the actor
 * ones were headed "Movies Directed by", and every one of them called an
 * undefined `fetchMovies` from its Load More handler — the fetcher is declared
 * as `fetchSeries` — so the button threw a ReferenceError instead of paging.
 */
const PersonCreditsPage = ({ slug, heading, fetcher, collection, series }) => {
    const [name, setName] = useState("");
    const [credits, setCredits] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (targetPage) => {
        setLoading(true);
        try {
            const data = await fetcher(slug, targetPage);
            //! append rather than replace: this is a "load more" list, and the
            //! first page has already been rendered by the time page two lands
            setCredits((current) => (targetPage === 1 ? data[collection] : [...current, ...data[collection]]));
            setHasNextPage(Boolean(data.pagination?.hasNextPage));
            setName(data.actor?.fullName || data.director?.fullName || data.musician?.fullName || "");
        } catch (error) {
            console.error("Error fetching credits:", error);
        } finally {
            setLoading(false);
        }
    }, [fetcher, slug, collection]);

    //! StrictMode mounts twice in development; without this the first page is
    //! fetched and appended twice
    const started = useRef(false);
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        load(1);
    }, [load]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        load(next);
    };

    return (
        <main className="container md:pt-14 pt-5 md:pb-20 pb-10">
            <h1 className="text-white 3xl:text-3xl md:text-2xl text-xl font-bold tracking-[-0.02em] capitalize">
                {name ? heading(name) : " "}
            </h1>

            <div className="grid 3xl:grid-cols-6 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2
                xl:gap-8 md:gap-6 gap-4 mt-9">
                {credits.map((credit) => (
                    <MovieCard
                        key={credit._id}
                        series={series}
                        id={credit.slug || credit._id}
                        title={credit.title}
                        image={credit.thumbnail}
                        duration={credit.duration}
                        episodes={credit.totalEpisodes}
                        view={credit.views}
                        rate={credit.rate}
                    />
                ))}
                {loading && Array.from({ length: 6 }).map((_, index) => <MovieCardSkeleton key={`skeleton-${index}`} />)}
            </div>

            {!loading && credits.length === 0 && (
                <p className="text-c-grey-60 md:text-sm text-super-xs italic mt-8">Nothing in the catalogue yet.</p>
            )}

            {hasNextPage && (
                <div className="flex justify-center mt-10">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loading}
                        className="bg-c-red-45 hover:bg-c-red-50 disabled:opacity-60 text-white font-medium
                            px-5 py-2.5 rounded-lg flex items-center gap-2 duration-150"
                    >
                        {loading ? "Loading" : "Load more"}
                        {loading && (
                            <span role="status">
                                <SpinnerSvg />
                                <span className="sr-only">Loading…</span>
                            </span>
                        )}
                    </button>
                </div>
            )}
        </main>
    );
}

export default PersonCreditsPage;
