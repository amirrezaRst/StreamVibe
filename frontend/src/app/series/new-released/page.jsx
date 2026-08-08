"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SpinnerSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import { getNewReleasedSeries } from "@/services/SeriesService";


const NewReleasedSeriesPage = () => {
    const [series, setSeries] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);

    const effectRan = useRef(false);

    const fetchSeries = useCallback(async (currentPage) => {
        setLoading(true);
        try {
            const data = await getNewReleasedSeries(currentPage, page);
            setSeries(prevMovies => [...prevMovies, ...data.series]);
            setHasNextPage(data.pagination.hasNextPage);
        } catch (error) {
            console.error("Error fetching series:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (effectRan.current === false) {
            fetchSeries();
            return () => {
                effectRan.current = true;
            }
        }
    }, [fetchSeries, page]);

    const loadMore = () => {
        setPage(prevPage => prevPage + 1);
        fetchSeries(page + 1);
    };

    return (
        <main className="container py-20">
            <div className="relative border border-c-black-15 rounded-xl xl:pt-8 xl:pb-10 pt-3 pb-10 lg:px-10 md:px-6 px-4">

                <h1
                    className="inline-flex absolute md:top-[-22.5px] top-[-19px] 3xl:text-super-base xl:text-base font-medium
                     text-super-sm items-center tracking-wide bg-c-red-45 text-white rounded-md px-6 md:h-[45px] h-[38px]"
                >
                    New Released Series
                </h1>

                <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-8 mt-10">

                    {!loading && series.map(({ _id, slug, title, duration, thumbnail, views, averageRating }) => (
                        <MovieCard series special key={_id} id={slug || _id} title={title} image={thumbnail} duration={duration} view={views} rate={averageRating} />
                    ))}
                    {loading && Array.from({ length: 12 }).map((_, index) => (
                        <MovieCardSkeleton special key={index} />
                    ))}


                </div>

                {hasNextPage && (
                    <div className="flex justify-center mt-10">
                        <button
                            onClick={loadMore}
                            className="bg-c-red-45 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? 'Loading' : 'Load More'}
                            <div className={loading ? "block" : "hidden"} role="status">
                                <SpinnerSvg />
                                <span className="sr-only">Loading...</span>
                            </div>
                        </button>
                    </div>
                )};
            </div>
        </main>
    );
}

export default NewReleasedSeriesPage;