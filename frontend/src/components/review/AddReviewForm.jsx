import { useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Rating from "react-rating";

import { CheckIcon, OutlineStarIcon, StarIcon } from "@/assets/Svgs";
import TextAreaField from "../TextAreaField";
import { addNewReview } from "../../services/ReviewService";


const AddReviewForm = ({ mediaId, user, setIsOpen, onPosted }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [rating, setRating] = useState(1);
    const [spoiler, setSpoiler] = useState(false);

    const onSubmit = async (data) => {
        const { text } = data;
        try {
            await addNewReview({
                fullName: user.fullName,
                email: user.email,
                text,
                rating,
                media: mediaId,
                spoiler,
            });
            reset();
            setSpoiler(false);

            //! the review is not live yet, so promising it "was added" would be
            //! a lie the reader discovers when they cannot find it
            toast.success('Thanks — your review will appear once it has been checked.');
            setIsOpen(false);
            if (onPosted) onPosted();
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextAreaField
                label="Review Text"
                id="text"
                placeholder="Write your review here"
                register={register}
                validation={{
                    required: {
                        value: true,
                        message: 'Review is required'
                    },
                    minLength: {
                        value: 3,
                        message: 'Review must be at least 3 characters'
                    }
                }}
                errors={errors}
            />

            <Rating
                initialRating={rating}
                onChange={(rate) => setRating(rate)}
                emptySymbol={<OutlineStarIcon className="xl:w-6 xl:h-6 w-5 h-5 mr-3" />}
                fullSymbol={<StarIcon className="xl:w-6 xl:h-6 w-5 h-5 mr-3" />}
                className="md:mt-4 mt-2"
            />

            {/*//! the author's own word about their own words — they know
                better than any number of readers whether it gives something away */}
            <button
                type="button"
                onClick={() => setSpoiler(current => !current)}
                aria-pressed={spoiler}
                className={`w-full flex items-start gap-2.5 text-start bg-c-black-06 border rounded-lg py-3 px-3 md:mt-6 mt-4 duration-150
                    ${spoiler ? "border-[#D99A34]/60" : "border-c-black-20 hover:border-c-black-25"}`}
            >
                <span className={`w-[15px] h-[15px] rounded flex items-center justify-center shrink-0 mt-px border-[1.5px] duration-150
                    ${spoiler ? "bg-[#D99A34] border-[#D99A34]" : "border-c-black-25"}`}>
                    {spoiler && <CheckIcon className="w-2.5 h-2.5 text-c-black-10" />}
                </span>
                <span>
                    <span className="block text-[12.5px] font-semibold text-c-grey-90">
                        This review gives something away
                    </span>
                    <span className="block text-[11.5px] text-c-grey-60 leading-snug mt-0.5">
                        It will be hidden behind a warning until a reader chooses to open it.
                    </span>
                </span>
            </button>

            <button
                className="bg-c-red-45 text-white py-2 px-4 rounded 3xl:text-lg text-super-sm block md:mt-8 mt-6"
                type="submit"
            >
                Submit Review
            </button>

            <p className="text-[11.5px] text-c-grey-60 mt-3 leading-snug">
                Reviews are checked before they appear. Yours will show up here for you in the meantime.
            </p>

        </form>
    );
}

export default AddReviewForm;