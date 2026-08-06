"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import { FlagIcon, HourglassIcon, SpoilerIcon } from "@/assets/Svgs";
import { reportSpoiler, withdrawSpoilerReport } from "@/services/ReviewService";
import StarRating from "../common/StarRating";
import SpoilerVeil from "./SpoilerVeil";

const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" })
    : null;

const ReviewItem = ({ review, signedIn }) => {
    const { _id, fullName, text, rating, date, status, isMine, spoiler } = review;

    //! reveal is per card and lasts as long as the page: reopening the title
    //! should put the warning back, or the veil protects nobody on a rewatch
    const [revealed, setRevealed] = useState(false);
    const [flagged, setFlagged] = useState(spoiler?.reportedByYou || false);
    const [veiled, setVeiled] = useState(review.isSpoiler);
    const [busy, setBusy] = useState(false);

    const awaitingReview = status === "pending";

    const toggleReport = async () => {
        if (!signedIn) {
            toast.error("Please log in to flag a review");
            return;
        }

        //! flip first so the press answers immediately, and put it back if the
        //! write turns out to have failed
        const next = !flagged;
        setFlagged(next);
        setBusy(true);

        try {
            const result = next ? await reportSpoiler(_id) : await withdrawSpoilerReport(_id);
            setVeiled(result.isSpoiler);
            if (result.isSpoiler && !revealed) setRevealed(false);

            toast.success(next ? "Thanks — we hid it behind a warning" : "Your report was withdrawn");
        } catch (error) {
            setFlagged(!next);
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    const hidden = veiled && !revealed;

    return (
        <div
            className={`py-4 px-4 bg-c-black-06 border rounded-lg
                3xl:basis-[450px] md:basis-[377px] flex-shrink-0 flex-grow-0 basis-full flex flex-col
                ${awaitingReview ? "border-[#D99A34]/30" : "border-c-black-15"}`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="text-white font-medium capitalize text-super-sm tracking-wide truncate">
                        {fullName}
                    </p>
                    {isMine && (
                        <span className="shrink-0 text-[10.5px] font-extrabold uppercase tracking-[0.06em]
                            text-[#7CADEA] bg-[#4C8DD9]/[0.14] py-0.5 px-2 rounded-full">
                            Yours
                        </span>
                    )}
                </div>
                <div className="rounded-full bg-c-black-08 border border-c-black-15 px-4 pb-1.5 pt-0.5 shrink-0">
                    <StarRating rating={rating} />
                </div>
            </div>

            {/*//! the veil covers the words only. Who wrote it and what they
                scored it are not spoilers, and seeing them is how a reader
                decides whether to open it at all. */}
            <div className={`relative mt-4 ${hidden ? "min-h-[104px]" : ""}`}>
                <p
                    className={`text-c-grey-60 lg:text-base text-sm duration-200
                        ${hidden ? "blur-[6px] opacity-70 select-none pointer-events-none" : ""}`}
                >
                    {text}
                </p>

                {hidden && <SpoilerVeil onReveal={() => setRevealed(true)} />}
            </div>

            {awaitingReview ? (
                <div className="flex items-start gap-2 mt-3 py-[7px] px-[11px] rounded-[7px] text-[11.5px] leading-snug
                    bg-[#D99A34]/[0.14] border border-[#D99A34]/[0.28] text-[#E8B663]">
                    <HourglassIcon className="w-[13px] h-[13px] shrink-0 mt-px" />
                    Waiting to be checked — only you can see this.
                </div>
            ) : (
                <div className="flex items-center gap-2.5 mt-auto pt-3 border-t border-c-black-15">
                    {!isMine && (
                        <button
                            type="button"
                            onClick={toggleReport}
                            disabled={busy}
                            aria-pressed={flagged}
                            className={`text-[11.5px] font-semibold inline-flex items-center gap-1.5 duration-150
                                disabled:opacity-50 ${flagged ? "text-[#E8B663]" : "text-c-black-30 hover:text-[#E8B663]"}`}
                        >
                            <FlagIcon className="w-3 h-3" />
                            {flagged ? "You flagged this" : "Contains spoilers?"}
                        </button>
                    )}

                    {veiled && revealed && (
                        <button
                            type="button"
                            onClick={() => setRevealed(false)}
                            className="text-[11.5px] font-semibold text-c-black-30 hover:text-c-grey-65 inline-flex items-center gap-1.5 duration-150"
                        >
                            <SpoilerIcon className="w-3 h-3" />
                            Hide again
                        </button>
                    )}

                    {date && <span className="ms-auto text-[11px] text-c-black-30">{formatDate(date)}</span>}
                </div>
            )}
        </div>
    );
};

export default ReviewItem;
