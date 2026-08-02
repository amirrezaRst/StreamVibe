"use client";

import { PlaySvg, SoundSvg } from "@/assets/Svgs";
import LikeButton from "./LikeButton";
import WatchlistButton from "./WatchlistButton";
import useUserStore from "@/stores/useUserStore";


const HeaderCallToAction = ({ mediaId, kind }) => {
    const user = useUserStore((state) => state.user);

    return (
        <div className="flex md:flex-row flex-col items-center justify-center gap-3.5">
            <button className="bg-c-red-45 text-white font-medium xl:h-12 h-11 px-6 flex items-center gap-1.5 rounded-md border-0 outline-none max-md:mt-3">
                <PlaySvg className="w-[28px]" /> Play Now
            </button>
            <div className="flex items-center gap-2.5">
                <WatchlistButton signedIn={!!user} kind={kind} media={mediaId} />
                <LikeButton userId={user?._id} media={mediaId} />
                <button
                    className="xl:h-12 h-11 xl:w-12 w-11 bg-c-black-06 border border-c-black-15 rounded-md flex items-center justify-center"
                >
                    <SoundSvg />
                </button>
            </div>
        </div>
    );
}

export default HeaderCallToAction;
