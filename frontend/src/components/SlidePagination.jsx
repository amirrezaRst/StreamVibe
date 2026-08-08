import React from 'react'

const { LeftArrowSvg } = require("@/assets/Svgs");


const SlidePagination = ({ mobile, currentIndex, total, onNext, onPrev }) => {
    return (
        <div className="rounded-xl bg-c-black-06 border border-c-black-12 p-2 lg:flex items-center hidden">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Previous"
                    className="3xl:w-[42px] 3xl:h-[42px] w-9 h-9 rounded-lg bg-c-black-10 border
                     border-c-black-12 flex justify-center items-center"
                    onClick={onPrev}
                >
                    <LeftArrowSvg className="stroke-white w-[16px] h-[16px]" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-1">
                    <div className="h-[2px] 3xl:min-w-5 min-w-3 3xl:w-7 w-5 bg-c-red-45"></div>
                    <div className="h-[2px] 3xl:min-w-5 min-w-3 bg-c-black-20"></div>
                    <div className="h-[2px] 3xl:min-w-5 min-w-3 bg-c-black-20"></div>
                    <div className="h-[2px] 3xl:min-w-5 min-w-3 bg-c-black-20"></div>
                    <div className="h-[2px] 3xl:min-w-5 min-w-3 bg-c-black-20"></div>
                </div>
                <button
                    type="button"
                    aria-label="Next"
                    className="3xl:w-[42px] 3xl:h-[42px] w-9 h-9 rounded-lg bg-c-black-10 border
                     border-c-black-12 flex justify-center items-center"
                    onClick={onNext}
                >
                    <LeftArrowSvg className="stroke-white w-[16px] h-[16px] rotate-180" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export default SlidePagination;