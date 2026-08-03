"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { BookmarkIcon } from "@/assets/Svgs";
import { addToWatchList, removeFromWatchList, watchListStatus } from "@/services/UserService";

/**
 * Sits next to the like button on a media page. Liking says "I enjoyed this";
 * this one says "I intend to watch this", which is why they are separate
 * buttons feeding two separate lists in the profile.
 */
const WatchlistButton = ({ signedIn, kind, media }) => {
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        if (!signedIn || !media) {
            setBusy(false);
            return;
        }

        let abandoned = false;
        watchListStatus(media).then(status => {
            if (abandoned) return;
            setSaved(status);
            setBusy(false);
        });

        return () => { abandoned = true; };
    }, [signedIn, media]);

    const handleClick = async () => {
        if (!signedIn) {
            toast.error("Please log in to save this to your watchlist");
            return;
        }

        //! flip first so the button answers immediately, and put it back if the
        //! write turns out to have failed
        const next = !saved;
        setSaved(next);
        setBusy(true);

        try {
            if (next) await addToWatchList(kind, media);
            else await removeFromWatchList(media);

            toast.success(next ? "Added to your watchlist" : "Removed from your watchlist");
        } catch (error) {
            setSaved(!next);
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
            title={saved ? "In your watchlist" : "Add to watchlist"}
            className="xl:h-12 h-11 xl:w-12 w-11 bg-c-black-06 border border-c-black-15 rounded-md
                flex items-center justify-center duration-200 disabled:opacity-60"
        >
            <BookmarkIcon
                className={`w-[22px] h-[22px] ${saved ? "text-c-red-45 fill-c-red-45" : "text-c-grey-60"}`}
            />
        </button>
    );
}

export default WatchlistButton;
