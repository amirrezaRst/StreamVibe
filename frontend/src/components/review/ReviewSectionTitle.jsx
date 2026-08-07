import { LeftArrowSvg, PlusSvg } from "@/assets/Svgs";

const ReviewSectionTitle = ({ setIsOpen, prev, next }) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-c-grey-60 text-lg font-medium">Reviews</h4>
            <div className="flex items-center gap-10">
                <button
                    className="btn-black-08 border border-c-black-15 rounded-lg py-2 px-3 3xl:text-base md:text-super-sm max-md:text-super-xs text-white/90"
                    onClick={() => setIsOpen(true)}
                >
                    <PlusSvg className="inline mr-1 max-md:w-5" /> Add Your Review
                </button>
                <div className="md:flex hidden gap-2.5">
                    <button
                        type="button"
                        aria-label="Previous reviews"
                        className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.9rem] h-[2.9rem]"
                        onClick={prev}
                    >
                        <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px]" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        aria-label="More reviews"
                        className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.9rem] h-[2.9rem]"
                        onClick={next}
                    >
                        <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px] rotate-180" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReviewSectionTitle;