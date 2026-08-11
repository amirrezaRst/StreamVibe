"use client";

import Link from "next/link";
import { useState } from "react";

import { LockIcon, PlaySvg } from "@/assets/Svgs";
import useUserStore from "@/stores/useUserStore";

//! the `trailer` field holds whatever was uploaded for a title, which across
//! the current catalogue is a cover image rather than a clip. Treating only
//! real video extensions as playable means the trailer button appears the day
//! actual trailers are uploaded, and stays hidden until then, without this
//! component having to know anything about the seed data
const PLAYABLE = /\.(mp4|webm|ogg|mov|m4v)$/i;

const Overlay = ({ poster, signedIn }) => (
    <div className="relative w-full h-full">
        {poster && (
            //! the still stays visible but dimmed — it is the thing being sold,
            //! so hiding it entirely would make the paywall harder to say yes to
            <img
                src={poster}
                alt=""
                className="absolute inset-0 w-full h-full object-cover brightness-[0.28]"
            />
        )}

        <div className="relative h-full flex flex-col items-center justify-center text-center px-5">
            <span className="w-12 h-12 rounded-full bg-c-black-10/80 border border-c-black-20 backdrop-blur-sm
                flex items-center justify-center mb-4">
                <LockIcon className="w-5 h-5 text-c-grey-70" aria-hidden="true" />
            </span>

            <h2 className="text-white md:text-xl text-base font-semibold mb-1.5">
                Included with a StreamVibe plan
            </h2>
            <p className="text-c-grey-65 md:text-super-sm text-xs max-w-sm mb-5">
                {signedIn
                    ? "Your account doesn't have an active plan right now. Pick one to start watching."
                    : "Sign in and choose a plan to watch this and everything else in the catalogue."}
            </p>

            <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <Link
                    href="/subscriptions"
                    className="bg-c-red-45 hover:bg-c-red-50 text-white md:text-super-sm text-xs font-medium
                        rounded-lg md:py-2.5 py-2 md:px-6 px-4 duration-150"
                >
                    View plans
                </Link>
                {!signedIn && (
                    <Link
                        href="/register"
                        className="bg-c-black-10 hover:bg-c-black-12 border border-c-black-20 text-c-grey-90
                            md:text-super-sm text-xs font-medium rounded-lg md:py-2.5 py-2 md:px-6 px-4 duration-150"
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </div>
    </div>
);

/**
 * The paywall as the viewer meets it.
 *
 * Everything around this component — the catalogue, the cast, the reviews —
 * stays open to everyone; this is the one place access is actually withheld,
 * and it mirrors the server-side check in RequireSubscription rather than
 * being the only thing standing between a visitor and the file.
 */
const WatchPlayer = ({ src, poster, trailer, title }) => {
    const user = useUserStore((state) => state.user);
    const entitlement = useUserStore((state) => state.entitlement);
    const loading = useUserStore((state) => state.loading);
    const [playingTrailer, setPlayingTrailer] = useState(false);

    const unlocked = entitlement?.active;
    const hasTrailer = trailer && PLAYABLE.test(trailer);

    //! until fetchUser lands, "not entitled" is not yet known — showing the
    //! paywall during that window would flash a lock at paying subscribers
    if (loading) {
        return <div className="w-full h-full skeleton-pulse skeleton-sweep bg-c-black-15" />;
    }

    if (unlocked) {
        return (
            <video
                src={src}
                poster={poster}
                className="w-full h-full object-cover"
                controls
            />
        );
    }

    if (playingTrailer) {
        return (
            <video
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${trailer}`}
                poster={poster}
                className="w-full h-full object-cover"
                controls
                autoPlay
            />
        );
    }

    return (
        <div className="relative w-full h-full">
            <Overlay poster={poster} signedIn={!!user} />

            {hasTrailer && (
                <button
                    type="button"
                    onClick={() => setPlayingTrailer(true)}
                    className="absolute md:bottom-5 bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2
                        bg-c-black-10/85 hover:bg-c-black-12 border border-c-black-20 backdrop-blur-sm
                        text-c-grey-90 md:text-xs text-[11px] font-semibold rounded-lg py-2 px-4 duration-150"
                >
                    <PlaySvg className="w-4 h-4" aria-hidden="true" />
                    Watch the trailer{title ? ` for ${title}` : ""}
                </button>
            )}
        </div>
    );
}

export default WatchPlayer;
