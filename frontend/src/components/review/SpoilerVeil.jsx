"use client";

import { EyeOutlineIcon, SpoilerIcon } from "@/assets/Svgs";

/**
 * Sits over a review that gives something away. The words stay in the card —
 * withholding them server-side would mean a second request on reveal and a
 * visible pause on a button that should feel instant — but they are blurred,
 * dimmed and unselectable, so they cannot be read through the blur or dragged
 * out of the page.
 *
 * Amber rather than red: red already means "this seat is yours" on the booking
 * page and "delete" in the console. A spoiler is a caution, not a destructive
 * act.
 */
const SpoilerVeil = ({ onReveal }) => (
    <div
        className="absolute inset-0 -mx-1 flex flex-col items-center justify-center gap-2.5 text-center p-2
            bg-c-black-06/[0.82] backdrop-blur-[2px] rounded"
    >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em]
            text-[#E8B663] bg-[#D99A34]/[0.14] border border-[#D99A34]/30 py-[3px] px-2.5 rounded-full">
            <SpoilerIcon className="w-[11px] h-[11px]" />
            Spoiler
        </span>

        <p className="text-[12.5px] text-c-grey-65 max-w-[26ch] leading-snug">
            This review gives away part of the story.
        </p>

        <button
            type="button"
            onClick={onReveal}
            className="bg-transparent border border-c-black-25 hover:border-c-grey-60 text-c-grey-90
                rounded-full py-1.5 px-4 text-[12.5px] font-bold inline-flex items-center gap-1.5 duration-150"
        >
            <EyeOutlineIcon className="w-[13px] h-[13px]" />
            Show it anyway
        </button>
    </div>
);

export default SpoilerVeil;
