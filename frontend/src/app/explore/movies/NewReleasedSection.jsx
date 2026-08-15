"use client";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import SlidePagination from "@/components/SlidePagination";
import { useEffect, useRef, useState } from "react";
import { getNewReleasedMovies } from "../../../services/MovieService";
import Link from "next/link";
import { LeftArrowSvg } from "@/assets/Svgs";



const NewReleasedSection = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const getMovies = async () => {
            const data = await getNewReleasedMovies() || [];
            setMovies(data?.movies || []);
            setLoading(false);
        };
        getMovies();
    }, []);


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
                    <h5 className="text-white 3xl:text-2.5xl md:text-1.5xl text-xl font-medium">
                        New Released
                    </h5>
                    <span className="text-c-grey-90 ml-16 3xl:text-base xl:text-super-sm md:text-sm text-super-xs">
                        <Link href={`/movies/new-released`}>
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
                {loading
                    ? Array.from({ length: 5 }).map((_, index) => <MovieCardSkeleton key={index} />) :
                    movies?.length === 0 ? <span className="3xl:text-super-base xl:text-super-sm max-md:text-sm text-c-grey-60">Sorry, no movies available yet. Please visit us again later.</span>
                         : movies.map(({ _id, slug, title, duration, thumbnail, views, averageRating }, index) => (
                            <MovieCard key={_id} id={slug || _id} title={title} image={thumbnail} duration={duration} view={views} rate={averageRating} />
                        ))}
            </div>
        </div>
    );
}

export default NewReleasedSection;