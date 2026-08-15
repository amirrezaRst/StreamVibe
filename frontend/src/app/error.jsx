"use client";

import { useEffect } from "react";
import Link from "next/link";

import FilmStripStage, { ERROR_ACTION_GHOST, ERROR_ACTION_PRIMARY } from "@/components/error/FilmStripStage";
import { HomeIcon } from "@/assets/Svgs";

/**
 * The 500. Same reel as the 404, one frame burning instead of empty.
 *
 * Unlike not-found.jsx this fetches nothing at all. It renders *because*
 * something already failed, and the thing that failed may well be the API the
 * posters would come from — so the frames are a fixed set shipped with the
 * app. A page whose entire job is handling failure must not add a new way to
 * fail.
 */

//! titles old enough to be certain of; they are decorative, and a missing file
//! degrades to an empty frame rather than an error
const FALLBACK_POSTERS = [
    "parasite.jpg",
    "inception.jpg",
    "interstellar.jpg",
    "dune.jpg",
];

const BURNING_POSTER = "joker.jpg";

const Error = ({ error, reset }) => {
    useEffect(() => {
        //! the digest is the only handle on what actually happened — the
        //! message itself is stripped in production builds
        console.error("Route error:", error?.digest ?? error);
    }, [error]);

    return (
        <FilmStripStage
            code="500"
            variant="burn"
            title="Reel Damaged"
            description="Something broke on our end while loading this page. The fault has been logged — trying again usually works."
            posters={FALLBACK_POSTERS}
            burnPoster={BURNING_POSTER}
        >
            {/*//! reset() re-renders just the segment that threw, so a fault
                that has already cleared costs a re-render rather than a full
                page load */}
            <button type="button" onClick={reset} className={ERROR_ACTION_PRIMARY}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                    <path d="M20 5v6h-6" />
                </svg>
                Try Again
            </button>
            <Link href="/" className={ERROR_ACTION_GHOST}>
                <HomeIcon className="md:w-[18px] w-4 h-4" aria-hidden="true" />
                Back to Home
            </Link>
        </FilmStripStage>
    );
};

export default Error;
