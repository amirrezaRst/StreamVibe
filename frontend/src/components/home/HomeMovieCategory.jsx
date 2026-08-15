"use client"
import React, { useState, useRef } from 'react';
import MultipleCardSkeleton from '../MultipleCardSkeleton';
import MultipleCard from '../MultipleCard';
import MovieCategoryTitle from './MovieCategoryTitle';
import CategoryRailError from '../common/CategoryRailError';
import useCategoryRail from '@/hooks/useCategoryRail';
import { fetchMovieCategories } from '@/services/MovieService';


const HomeMovieCategory = () => {
    const { entries, status, retry } = useCategoryRail(fetchMovieCategories);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    const handleNext = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, entries.length - 1));
        }
    };

    const handlePrev = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
            setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        }
    };

    return (
        <section className="container mt-14">
            <MovieCategoryTitle
                totalSlides={entries.length}
                currentIndex={currentIndex}
                onNext={handleNext}
                onPrev={handlePrev}
                showPagination={status !== "error"}
            />

            {status === "error" ? (
                <CategoryRailError onRetry={retry} />
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="flex lg:gap-8 md:gap-4 gap-2.5 flex-nowrap overflow-x-auto pb-2.5 custom-scrollbar custom-scrollbar-sm"
                >
                    {status === "loading"
                        ? Array.from({ length: 5 }).map((_, index) => <MultipleCardSkeleton key={index} />)
                        : entries.map(([category, images]) => (
                            <MultipleCard key={category} title={category} images={images} baseurl={"/explore"} />
                        ))}
                </div>
            )}
        </section>
    );
};


export default HomeMovieCategory;
