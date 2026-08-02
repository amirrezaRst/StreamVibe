"use client";

import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/assets/Svgs";

//! the shared XmarkIcon bakes in a white stroke, which would defeat the
//! hover colour change on the button below
const Cross = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

/**
 * The card used by both library grids. It is deliberately not the catalog's
 * MovieCard: here the poster carries an action (remove / unlike) and the
 * runtime and view count would only be noise, since the point of these grids
 * is deciding what to keep.
 */
const MediaCard = ({ media, removeLabel, removing, onRemove, liked }) => {
    const isSeries = media.kind === "Series";
    const href = isSeries ? `/series/${media._id}` : `/movies/${media._id}`;

    return (
        <div className="bg-c-black-10 border border-c-black-15 rounded-xl p-2.5 duration-200 hover:-translate-y-[3px] hover:border-c-black-20">
            <div className="relative rounded-[9px] overflow-hidden aspect-thumbnail bg-c-black-12">
                <Link href={href}>
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${media.thumbnail}`}
                        alt={media.title}
                        width={288}
                        height={324}
                        className="w-full h-full object-cover object-top"
                    />
                </Link>

                <span className="absolute bottom-2 left-2 text-[10.5px] font-bold uppercase tracking-wide bg-c-black-08/70 backdrop-blur-sm text-c-grey-90 py-[3px] px-2 rounded-[5px]">
                    {isSeries ? "Series" : "Movie"}
                </span>

                <button
                    type="button"
                    onClick={onRemove}
                    disabled={removing}
                    aria-label={removeLabel}
                    title={removeLabel}
                    className={`absolute top-2 right-2 w-[30px] h-[30px] rounded-full bg-c-black-08/70 backdrop-blur-sm
                        border border-white/10 flex items-center justify-center duration-150
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${liked ? "text-[#E5477A] hover:bg-[#E5477A] hover:text-white" : "text-white hover:bg-c-red-45"}
                        ${removing ? "" : "hover:scale-[1.08]"}`}
                >
                    {liked ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21s-7.5-4.9-10.1-9.3C.3 8.6 1.6 5 5 4.2c2-.5 3.9.3 5 1.9 1.1-1.6 3-2.4 5-1.9 3.4.8 4.7 4.4 3.1 7.5C19.5 16.1 12 21 12 21z" />
                        </svg>
                    ) : (
                        <Cross />
                    )}
                </button>
            </div>

            <Link href={href}>
                <h3 className="text-white text-sm font-semibold mt-2.5 mb-1 mx-0.5 leading-snug line-clamp-2 capitalize">
                    {media.title}
                </h3>
            </Link>
            <div className="flex items-center gap-1 mx-0.5 text-c-grey-60 text-[12.5px] tabular-nums">
                <StarIcon className="w-3.5 h-3.5" />
                {media.rate ? media.rate.toFixed(1) : "Not rated"}
            </div>
        </div>
    );
}

export default MediaCard;
