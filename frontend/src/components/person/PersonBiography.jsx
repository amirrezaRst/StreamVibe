"use client";

import { useState } from "react";

import { LeftArrowSvg, UserCircleIcon } from "@/assets/Svgs";

/**
 * The toggle carries a written label rather than a bare rotating arrow. The old
 * one was a chevron under a gradient with nothing to say what it did — and on a
 * short biography, which most of these are, it appeared over text that was
 * already fully visible.
 */
const PersonBiography = ({ bio, fullName }) => {
    const [expanded, setExpanded] = useState(false);

    if (!bio?.trim()) {
        return (
            <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:p-6 md:p-5 p-4">
                <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-c-grey-60 mb-3.5">
                    <UserCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    Biography
                </h2>
                <p className="text-super-xs text-c-grey-60 italic m-0">
                    No biography on record for {fullName} yet.
                </p>
            </div>
        );
    }

    //! only worth a control if there is meaningfully more to show
    const long = bio.length > 260;

    return (
        <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:p-6 md:p-5 p-4">
            <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-c-grey-60 mb-3.5">
                <UserCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Biography
            </h2>

            <p className={`text-c-grey-65 3xl:text-base md:text-sm text-super-xs leading-[1.75] m-0
                ${long && !expanded ? "line-clamp-3" : ""}`}>
                {bio}
            </p>

            {long && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((open) => !open)}
                    className="inline-flex items-center gap-2 mt-3.5 text-super-xs font-bold
                        text-c-grey-70 hover:text-white duration-150"
                >
                    {expanded ? "Show less" : "Read the full biography"}
                    <LeftArrowSvg
                        className={`w-3.5 h-3.5 stroke-current duration-300 ${expanded ? "rotate-90" : "-rotate-90"}`}
                        aria-hidden="true"
                    />
                </button>
            )}
        </div>
    );
}

export default PersonBiography;
