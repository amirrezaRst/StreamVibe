"use client";

import { SpinnerSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import { fetchDirectorSeries } from "@/services/DirectorService";
import { useCallback, useEffect, useRef, useState } from "react";


const DirectorSeriesPage = ({ params: { slug: directorId } }) => {
    const [director, setDirector] = useState(null);
    const [series, setSeries] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);

    const effectRan = useRef(false);

    const fetchSeries = useCallback(async (currentPage) => {
        setLoading(true);
        try {
            const data = await fetchDirectorSeries(directorId, currentPage, page);
            setSeries(prevSeries => [...prevSeries, ...data.series]);
            setHasNextPage(data.pagination.hasNextPage);
            setDirector(data.director.fullName);
        } catch (error) {
            console.error("Error fetching series:", error);
        } finally {
            setLoading(false);
        }
    }, [directorId, page]);

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
        <main className="container md:pt-14 pt-5 md:pb-20 pb-10">

            <h1 className="text-white text-2xl font-medium">
                Series Directed by <span className="capitalize">{director}</span>
            </h1>

            <div className="grid grid-cols-5 gap-8 mt-10">

                {!loading && series.map(({ _id, slug, title, totalEpisodes, thumbnail, views, rate }) => (
                    <MovieCard key={_id} series id={slug || _id} title={title} image={thumbnail} episodes={totalEpisodes} view={views} rate={rate} />
                ))}
                {loading && Array.from({ length: 12 }).map((_, index) => (
                    <MovieCardSkeleton key={index} />
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

        </main>
    );
}

export default DirectorSeriesPage;