"use client";

import Image from "next/image";
import { FlagIcon, SpoilerIcon } from "@/assets/Svgs";

const STATUS_TONES = {
    pending: "bg-[#D99A34]/[0.14] text-[#E8B663]",
    approved: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
    rejected: "bg-c-red-45/[0.12] text-c-red-80",
};

const Checkbox = ({ checked }) => (
    <span className={`w-[15px] h-[15px] rounded-[3px] border-[1.5px] shrink-0 flex items-center justify-center duration-150
        ${checked ? "bg-c-red-45 border-c-red-45" : "border-c-black-25"}`}>
        {checked && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        )}
    </span>
);

const ReviewQueueRow = ({ review, selected, focused, onToggleSelect, onModerate, onSpoiler, onDelete, busy }) => {
    const reports = review.spoiler?.reports?.length || 0;
    const flaggedByAuthor = review.spoiler?.byAuthor;
    const pending = review.status === "pending";

    return (
        <div
            data-review-row
            className={`flex gap-3 py-3 px-3.5 border-b border-c-black-15 last:border-b-0 items-start duration-150
                ${selected ? "bg-c-red-45/[0.07]" : "hover:bg-c-black-12"}
                ${focused ? "ring-1 ring-inset ring-c-red-45/60" : ""}
                ${reports > 0 ? "border-s-2 border-s-[#D99A34]" : "border-s-2 border-s-transparent"}`}
        >
            <button
                type="button"
                onClick={onToggleSelect}
                aria-label={selected ? "Deselect this review" : "Select this review"}
                className="pt-0.5"
            >
                <Checkbox checked={selected} />
            </button>

            <div className="w-[34px] h-[38px] rounded shrink-0 overflow-hidden bg-c-black-12">
                {review.media?.thumbnail && (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${review.media.thumbnail}`}
                        alt={review.media.title}
                        width={68} height={76}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[12.5px] font-bold text-c-grey-90">{review.fullName}</span>
                    <span className="text-c-red-45 text-[11px] tracking-[1px]" aria-label={`${review.rating} out of 5`}>
                        {"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}
                    </span>
                    <span className="text-[11px] text-c-black-30 truncate capitalize">
                        on {review.media?.title || "a deleted title"}
                    </span>
                    <span className={`text-[10.5px] font-extrabold py-0.5 px-2 rounded-full capitalize ${STATUS_TONES[review.status]}`}>
                        {review.status}
                    </span>
                    {flaggedByAuthor && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#E8B663] bg-[#D99A34]/[0.14] py-0.5 px-2 rounded-full">
                            <SpoilerIcon className="w-2.5 h-2.5" /> author marked spoiler
                        </span>
                    )}
                    {reports > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#E8B663] bg-[#D99A34]/[0.14] py-0.5 px-2 rounded-full">
                            <FlagIcon className="w-2.5 h-2.5" /> {reports} reader{reports === 1 ? "" : "s"}
                        </span>
                    )}
                </div>
                <p className="text-[12.5px] text-c-grey-65 leading-relaxed">{review.text}</p>
                {review.rejectionReason && (
                    <p className="text-[11.5px] text-c-red-80 mt-1">Rejected: {review.rejectionReason}</p>
                )}
            </div>

            <div className="flex gap-1.5 shrink-0 items-center">
                {pending ? (
                    <>
                        <button
                            type="button" onClick={() => onModerate("approved")} disabled={busy}
                            className="rounded-[7px] py-1.5 px-3 text-xs font-bold border border-[#3DA872]/35
                                bg-[#3DA872]/[0.14] text-[#6FCB9C] hover:bg-[#3DA872]/25 duration-150 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            type="button" onClick={() => onModerate("rejected")} disabled={busy}
                            className="rounded-[7px] py-1.5 px-3 text-xs font-bold border border-c-red-45/35
                                bg-c-red-45/[0.12] text-c-red-80 hover:bg-c-red-45/20 duration-150 disabled:opacity-50"
                        >
                            Reject
                        </button>
                    </>
                ) : (
                    <>
                        {review.isSpoiler && (
                            <button
                                type="button" onClick={() => onSpoiler(false)} disabled={busy}
                                className="rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border border-c-black-20
                                    bg-c-black-12 text-c-grey-65 hover:text-c-grey-90 duration-150 disabled:opacity-50"
                            >
                                Not a spoiler
                            </button>
                        )}
                        <button
                            type="button" onClick={onDelete} disabled={busy}
                            className="rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border border-c-red-45/35
                                text-c-red-80 hover:bg-c-red-45/[0.12] duration-150 disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ReviewQueueRow;
