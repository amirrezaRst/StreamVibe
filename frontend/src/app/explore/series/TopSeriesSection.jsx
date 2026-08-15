"use client";
import MultipleCard from "@/components/MultipleCard";
import SlidePagination from "@/components/SlidePagination";
import { useRef, useState } from "react";
import MultipleCardSkeleton from "@/components/MultipleCardSkeleton";
import CategoryRailError from "@/components/common/CategoryRailError";
import useCategoryRail from "@/hooks/useCategoryRail";
import { fetchTopRatedCategories } from "../../../services/SeriesService";

const TopSeriesSection = () => {
    const { entries, status, retry } = useCategoryRail(fetchTopRatedCategories);
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
        <div>
            <div className="flex items-center justify-between mb-4">
                <h5 className="text-white 3xl:text-2.5xl md:text-1.5xl text-lg font-medium">Popular Top 10 In Genres</h5>
                {/*//! hidden in the error state — the arrows would scroll a
                    container that is no longer rendered */}
                {status !== "error" && (
                    <SlidePagination currentIndex={currentIndex} onNext={handleNext} onPrev={handlePrev} total={entries.length} />
                )}
            </div>

            {status === "error" ? (
                <CategoryRailError onRetry={retry} />
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="flex lg:gap-8 gap-4 flex-nowrap overflow-x-auto pb-2.5 custom-scrollbar custom-scrollbar-sm"
                >
                    {status === "loading"
                        ? Array.from({ length: 5 }).map((_, index) => <MultipleCardSkeleton key={index} />)
                        : entries.map(([category, thumbnail]) => (
                            <MultipleCard key={category} title={category} images={thumbnail} baseurl={"/series/genres"} topRated />
                        ))}
                </div>
            )}
        </div>
    );
}

export default TopSeriesSection;
