"use client";

import { LeftArrowSvg } from "@/assets/Svgs";
import { useState } from "react";

const Biography = ({ bio }) => {
    const [showMore, setShowMore] = useState(false);

    return (
        <div
            className="bg-c-black-10 border border-c-black-15 rounded-2.5xl xl:px-8 xl:py-6 md:px-5 md:py-5 px-3.5 py-3.5"
        >
            <h4
                className="text-white 3xl:text-xl lg:text-lg md:text-super-base text-super-base font-medium lg:mb-4 md:mb-5 mb-3.5"
            >
                Biography
            </h4>
            <div
                className={`relative ${showMore ? "max-h-screen pb-10" : "max-h-24"} overflow-hidden transition-all duration-1000`}
            >
                <p className="text-c-grey-75 3xl:text-base xl:text-super-sm text-sm tracking-wide leading-7">
                    {!bio || bio === "" ? <span className="pb-10">No biography available yet</span> : bio}
                </p>
                <div
                    className={`absolute bottom-0 left-0 w-full h-12 z-10 bg-gradient-to-t from-c-black-10
                     via-c-black-10/80 via-60% to-c-black-10/0 ${!bio || bio === "" ? "hidden" : "flex"} justify-center items-end `}
                >
                    <button
                        type="button"
                        aria-expanded={showMore}
                        aria-label={showMore ? "Show less of this biography" : "Read the full biography"}
                        className={`${showMore && "rotate-180"} p-1.5 mt-1 duration-700`}
                        onClick={() => setShowMore(!showMore)}
                    >
                        <LeftArrowSvg className="w-5 h-5 stroke-white -rotate-90" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Biography;