import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import Link from "next/link";
import { Suspense } from "react";

const MovieGenreSection = ({movies,genres}) => {
    return (
        <div className="relative border border-c-black-15 rounded-xl xl:pt-8 xl:pb-10 pt-3 pb-10 lg:px-10 md:px-6 px-4">

            <h1
                className="inline-flex absolute md:top-[-22.5px] top-[-19px] 3xl:text-super-base xl:text-base font-medium
                     text-super-sm items-center tracking-wide bg-c-red-45 text-white rounded-md px-6 md:h-[45px] h-[38px] capitalize"
            >
                {genres} Genre Movies
            </h1>

            <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-8 mt-10">

                <Suspense fallback={Array.from({ length: 5 }).map((_, index) => {
                    <MovieCardSkeleton special key={index} />
                })}>
                    {movies.map(({ _id, slug, title, duration, thumbnail, views, rate }) => (
                        <MovieCard special key={_id} id={slug || _id} title={title} image={thumbnail} duration={duration} view={views} rate={rate} />
                    ))}
                </Suspense>

            </div>

            <div className="flex justify-center mt-10">
                <Link href={`/movies/genres/${genres}`}>
                    <button
                        className="bg-c-red-45 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        See More
                    </button>
                </Link>
            </div>

        </div>
    );
}

export default MovieGenreSection;