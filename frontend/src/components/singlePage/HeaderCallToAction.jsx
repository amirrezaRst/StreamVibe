"use client";

import Link from "next/link";

import { PlaySvg } from "@/assets/Svgs";
import LikeButton from "./LikeButton";
import WatchlistButton from "./WatchlistButton";
import useUserStore from "@/stores/useUserStore";

const playButtonClass = "bg-c-red-45 text-white font-medium xl:h-12 h-11 px-6 flex items-center gap-1.5 rounded-md border-0 outline-none max-md:mt-3";

const HeaderCallToAction = ({ mediaId, kind, onPlay }) => {
    const user = useUserStore((state) => state.user);
    const isSeries = kind === "Series";

    return (
        <div className="flex md:flex-row flex-col items-center justify-center gap-3.5">
            {/*//! a series has no single thing to play here — it plays a given
                episode — so Play Now goes straight to the first one rather than
                trying to start something in place, which is what a film does */}
            {isSeries ? (
                <Link href={`/series/${mediaId}/1/1`} className={playButtonClass}>
                    <PlaySvg className="w-[28px]" aria-hidden="true" /> Play Now
                </Link>
            ) : (
                <button type="button" onClick={onPlay} className={playButtonClass}>
                    <PlaySvg className="w-[28px]" aria-hidden="true" /> Play Now
                </button>
            )}
            <div className="flex items-center gap-2.5">
                <WatchlistButton signedIn={!!user} kind={kind} media={mediaId} />
                <LikeButton userId={user?._id} media={mediaId} />
            </div>
        </div>
    );
}

export default HeaderCallToAction;
