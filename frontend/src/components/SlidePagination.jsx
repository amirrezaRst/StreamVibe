import React from 'react';

import { LeftArrowSvg } from "@/assets/Svgs";

//! The rails scroll by a fixed 300px rather than by whole cards, so there is no
//! honest one-tick-per-item mapping. Five ticks stand in for the whole run and
//! the lit one tracks how far through it the caller says it is — the shape the
//! component always looked like it had, before this it was five hardcoded divs
//! that never moved no matter what was passed in.
const TICKS = 5;

const SlidePagination = ({ mobile, currentIndex = 0, total = 0, onNext, onPrev }) => {
    //! nothing to page through — an empty or failed rail should not offer
    //! arrows that scroll a container with nothing in it
    if (!total) return null;

    const lastIndex = Math.max(total - 1, 0);
    const clamped = Math.min(Math.max(currentIndex, 0), lastIndex);
    //! map position onto the tick strip; a single-item rail lights the first
    const activeTick = lastIndex === 0 ? 0 : Math.round((clamped / lastIndex) * (TICKS - 1));

    const atStart = clamped <= 0;
    const atEnd = clamped >= lastIndex;

    return (
        <div className="rounded-xl bg-c-black-06 border border-c-black-12 p-2 lg:flex items-center hidden">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Previous"
                    className="3xl:w-[42px] 3xl:h-[42px] w-9 h-9 rounded-lg bg-c-black-10 border
                     border-c-black-12 flex justify-center items-center duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={onPrev}
                    disabled={atStart}
                >
                    <LeftArrowSvg className="stroke-white w-[16px] h-[16px]" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: TICKS }).map((_, tick) => (
                        <div
                            key={tick}
                            className={`h-[2px] 3xl:min-w-5 min-w-3 duration-200
                                ${tick === activeTick ? "bg-c-red-45 3xl:w-7 w-5" : "bg-c-black-20"}`}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    aria-label="Next"
                    className="3xl:w-[42px] 3xl:h-[42px] w-9 h-9 rounded-lg bg-c-black-10 border
                     border-c-black-12 flex justify-center items-center duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={onNext}
                    disabled={atEnd}
                >
                    <LeftArrowSvg className="stroke-white w-[16px] h-[16px] rotate-180" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export default SlidePagination;
