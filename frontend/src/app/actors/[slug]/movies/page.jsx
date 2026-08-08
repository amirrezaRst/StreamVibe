"use client";

import { SpinnerSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import { fetchActorMovies } from "@/services/ActorService";
import { useCallback, useEffect, useRef, useState } from "react";


const ActorMoviesPage = ({ params: { slug: actorId } }) => {
    const [actor, setActor] = useState(null);
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);

    const effectRan = useRef(false);

    const fetchSeries = useCallback(async (currentPage) => {
        setLoading(true);
        try {
            const data = await fetchActorMovies(actorId, currentPage, page);
            setMovies(prevMovies => [...prevMovies, ...data.movies]);
            setHasNextPage(data.pagination.hasNextPage);
            setActor(data.actor.fullName);
        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (effectRan.current === false) {
            fetchSeries(page);
            return () => {
                effectRan.current = true;
            }
        }
    }, [fetchSeries, page]);

    const loadMore = () => {
        setPage(prevPage => prevPage + 1);
        fetchMovies(page + 1);
    };

    return (
        <main className="container md:pt-14 pt-5 md:pb-20 pb-10">

            <h1 className="text-white text-2xl font-medium">
                Movies Directed by <span className="capitalize">{actor}</span>
            </h1>

            <div className="grid grid-cols-5 gap-8 mt-10">

                {!loading && movies.map(({ _id, slug, title, duration, thumbnail, views, rate }) => (
                    <MovieCard key={_id} id={slug || _id} title={title} image={thumbnail} duration={duration} view={views} rate={rate} />
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

export default ActorMoviesPage;