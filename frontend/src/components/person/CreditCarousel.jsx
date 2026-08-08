"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { LeftArrowSvg } from "@/assets/Svgs";
import MovieCard from "@/components/MovieCard";
import SlidePagination from "@/components/SlidePagination";

/**
 * One credits row. Replaces the four near-identical MovieSection /
 * SeriesSection copies that lived under the actor and director routes — the
 * copies are where the wrong links and the "for this director" wording on
 * actor pages came from.
 */
const CreditCarousel = ({ heading, seeAllHref, credits = [], emptyNote, series }) => {
    const [index, setIndex] = useState(0);
    const scroller = useRef(null);

    const step = (delta) => {
        if (!scroller.current) return;
        scroller.current.scrollBy({ left: delta * 300, behavior: "smooth" });
        setIndex((current) => Math.min(Math.max(current + delta, 0), Math.max(credits.length - 1, 0)));
    };

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-baseline gap-5 min-w-0">
                    <h2 className="text-white 3xl:text-2xl xl:text-xl md:text-lg text-super-base font-bold tracking-[-0.015em] capitalize">
                        {heading}
                    </h2>
                    {credits.length > 0 && (
                        <Link
                            href={seeAllHref}
                            className="inline-flex items-center gap-2 text-c-grey-60 hover:text-c-grey-90 duration-150
                                md:text-super-xs text-xs shrink-0"
                        >
                            See all
                            <LeftArrowSvg className="w-4 h-4 stroke-current rotate-180" aria-hidden="true" />
                        </Link>
                    )}
                </div>

                {credits.length > 0 && (
                    <SlidePagination
                        onNext={() => step(1)}
                        onPrev={() => step(-1)}
                        currentIndex={index}
                        total={credits.length}
                    />
                )}
            </div>

            {credits.length === 0 ? (
                <p className="text-c-grey-60 md:text-sm text-super-xs italic m-0">{emptyNote}</p>
            ) : (
                <div
                    ref={scroller}
                    className="flex lg:gap-8 gap-4 flex-nowrap overflow-x-auto pb-2.5 custom-scrollbar custom-scrollbar-sm"
                >
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
                </div>
            )}
        </section>
    );
}

export default CreditCarousel;
