"use client";

import { LeftArrowSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import SlidePagination from "@/components/SlidePagination";
import Link from "next/link";
import { useRef, useState } from "react";



const MovieSection = ({ slug, fullName, moviesData }) => {
    const [movies, setMovies] = useState(moviesData || []);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    const handleNext = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, movies.length - 1));
        }
    };

    const handlePrev = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
            setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        }
    };

    return (
        <div className="mt-9">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center max-md:w-full max-md:justify-between">
                    <h5 className="text-white 3xl:text-2.5xl xl:text-1.5xl md:text-xl text-lg font-medium">
                        <span className="capitalize">{fullName}</span>{"'"}s movies
                    </h5>
                    <span className="text-c-grey-90 ml-16 3xl:text-base xl:text-super-sm md:text-sm text-super-xs">
                        <Link href={`/directors/${slug}/movies`}>
                            See more <LeftArrowSvg className="inline stroke-c-grey-90 rotate-180 ml-1.5 md:w-[18px] w-4" />
                        </Link>
                    </span>
                </div>
                <SlidePagination onNext={handleNext} onPrev={handlePrev} currentIndex={currentIndex} total={movies ? movies.length : 0} />
            </div>

            <div
                ref={scrollContainerRef}
                className="flex lg:gap-8 gap-4 flex-nowrap overflow-x-auto pb-2.5 custom-scrollbar custom-scrollbar-sm"
            >
                {loading ?
                    Array.from({ length: 5 }).map((_, index) => <MovieCardSkeleton key={index} />)
                    : movies?.length == 0 ? <span className="3xl:text-super-base xl:text-super-sm max-md:text-sm text-c-grey-60">No films for this director in the catalogue yet.</span>
                        : movies.map(({ _id, slug, title, duration, thumbnail, views, rate }) => (
                            <MovieCard key={_id} id={slug || _id} title={title} image={thumbnail} duration={duration} view={views} rate={rate} />
                        ))}
            </div>
        </div>
    );
}

export default MovieSection;