"use client";

import Image from "next/image";
import { useState } from "react";

import { LeftArrowSvg } from "@/assets/Svgs";
import WatchPlayer from "./WatchPlayer";
import HeaderCallToAction from "../singlePage/HeaderCallToAction";

/**
 * Movies had no player at all — "Play Now" was a `<button>` with no
 * `onClick`. This is the same hero box (`watching` swaps its content) rather
 * than a route to a separate watch page, both because that box is already
 * the right shape and size, and because leaving the poster hero one click
 * away instead of a full navigation keeps the ergonomics closer to a
 * Netflix-style "play in place" than to a full page swap.
 *
 * A series has no single thing to play here — it plays a given episode — so
 * its "Play Now" is a plain Link to the first one; only a film owns this
 * in-place toggle.
 */
const TopHeader = ({ id, kind, title, description, cover, poster, trailer, files }) => {
    const [watching, setWatching] = useState(false);

    if (watching) {
        return (
            <div className="relative w-full xl:h-[80vh] md:h-[60vh] h-[50vh] overflow-hidden rounded-xl bg-black">
                <WatchPlayer
                    src="/images/short-video.mp4"
                    poster={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${poster}`}
                    trailer={trailer}
                    title={title}
                    qualities={files}
                />
                <button
                    type="button"
                    onClick={() => setWatching(false)}
                    aria-label="Back to details"
                    className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/55 border border-white/15
                        backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 duration-150
                        focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                    <LeftArrowSvg className="w-4 h-4 stroke-current" aria-hidden="true" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full xl:h-[80vh] md:h-[60vh] h-[50vh] overflow-hidden rounded-xl">
            {/*//! this cover is the largest thing on the page and almost always
                the LCP element, so it is fetched eagerly and served at the
                viewport's width rather than at whatever the upload happened to
                be. It was a raw <img> before: full resolution, every time. */}
            <Image
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${cover}`}
                alt={title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: "center 60%" }}
            />

            <div
                className="w-full absolute bottom-0 md:pb-10 pb-8 pt-20 text-center md:px-20 px-4
                bg-gradient-to-t from-c-black-08/90 via-c-black-08/60 via-65% to-transparent"
            >
                <h1 className="text-2.5xl text-white font-semibold">{title}</h1>
                <p
                    className="line-clamp-2 md:text-c-grey-60 text-c-grey-90 2xl:text-base xl:text-super-sm text-sm md:mt-3 mt-1 mb-5 md:block hidden"
                >
                    {!description || description === "" ? "No description available yet!" : description}
                </p>
                <HeaderCallToAction mediaId={id} kind={kind} onPlay={() => setWatching(true)} />
            </div>

        </div>
    );
}

export default TopHeader;
