"use client";

import ReviewItem from "./ReviewItem";
import ReviewItemSkeleton from "./ReviewItemSkeleton";
import { useCallback, useEffect, useRef, useState } from "react";
import ReviewSectionTitle from "./ReviewSectionTitle";
import DialogModal from "../modal/DialogModal";
import AddReviewForm from "./AddReviewForm";
import { fetchReviews } from "../../services/ReviewService";
import useUserStore from "@/stores/useUserStore";
import { LeftArrowSvg } from "@/assets/Svgs";


const ReviewSection = ({ id }) => {
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const scrollContainerRef = useRef(null);
    const user = useUserStore((state) => state.user);

    //! also re-run when the viewer changes: signing in is what makes their own
    //! pending review visible, and lights up a report button they already used
    const loadReviews = useCallback(async () => {
        const data = await fetchReviews(id);
        setPreviews(data || []);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews, user?._id]);


    const handleNext = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:py-7 xl:px-7 md:px-6 md:py-6 px-5 py-5">
            <ReviewSectionTitle setIsOpen={setIsOpen} prev={handlePrev} next={handleNext} />
            <div
                ref={scrollContainerRef}
                className="flex 3xl:gap-6 lg:gap-[2%] gap-4 flex-nowrap overflow-x-auto custom-scrollbar custom-scrollbar-sm pb-2.5"
            >

                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => <ReviewItemSkeleton key={index} />)
                ) : previews?.length === 0 ? (
                    <p className="text-white 2xl:text-base xl:text-super-sm md:text-sm text-super-xs">
                        No reviews posted yet. Your feedback helps!
                    </p>
                ) :
                    (
                        previews.map(review => (
                            <ReviewItem key={review._id} review={review} signedIn={!!user} />
                        ))
                    )}

            </div>
            <div className="flex md:hidden gap-2.5 justify-center mt-3">
                <button
                    className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.9rem] h-[2.9rem]"
                    onClick={handlePrev}
                >
                    <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px]" />
                </button>
                <button
                    className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.9rem] h-[2.9rem]"
                    onClick={handleNext}
                >
                    <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px] rotate-180" />
                </button>
            </div>

            <DialogModal user={user} isOpen={isOpen} setIsOpen={setIsOpen} title={"Add Your Review"}>
                {/*//! reload after posting so the author's own pending review
                    appears straight away rather than on the next visit */}
                <AddReviewForm mediaId={id} user={user} setIsOpen={setIsOpen} onPosted={loadReviews} />
            </DialogModal>

        </div>
    )
};

export default ReviewSection;