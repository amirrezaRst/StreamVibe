"use client";

import Link from "next/link";

import { PlaySvg } from "@/assets/Svgs";
import LikeButton from "@/components/singlePage/LikeButton";
import WatchlistButton from "@/components/singlePage/WatchlistButton";
import useUserStore from "@/stores/useUserStore";

/**
 * Play Now used to have no `href`; watchlist, like and mute were unwired
 * icon buttons. Play Now now links to the real title, and watchlist/like are
 * the same components the detail page uses — not redrawn, so they already
 * know how to talk to a signed-in session. Mute is gone: it implied a video
 * preview that has never existed here.
 */
const CarouselCallToAction = ({ id, kind, mediaId }) => {
    const user = useUserStore((state) => state.user);
    const href = `/${kind === "Series" ? "series" : "movies"}/${id}`;

    return (
        <div
            className="carousel-rise flex md:flex-row flex-col items-center justify-center md:gap-3.5 gap-2"
            style={{ animationDelay: "170ms" }}
        >
            <Link
                href={href}
                className="bg-c-red-45 text-white md:text-super-sm text-super-xs font-medium xl:h-10 md:h-11 h-9 px-5 flex items-center md:gap-1.5 gap-1 rounded-md border-0
                 outline-none max-md:mt-3"
            >
                <PlaySvg className="md:w-[27px] w-5" aria-hidden="true" /> Play Now
            </Link>
            <div className="flex items-center gap-2.5">
                <WatchlistButton signedIn={!!user} kind={kind} media={mediaId} />
                <LikeButton userId={user?._id} media={mediaId} />
            </div>
        </div>
    );
}

export default CarouselCallToAction;
