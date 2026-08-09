import { LeftArrowSvg } from "@/assets/Svgs";

/**
 * One dot per slide, not four fixed ones — and the arrows and dots actually
 * move the carousel now instead of sitting there for decoration.
 */
const CarouselPagination = ({ total, activeIndex, onNext, onPrev, onSelect }) => {
    if (total < 2) return null;

    return (
        <div className="w-full flex items-center justify-between md:px-8 px-4 md:mt-7 mt-5 relative z-10">
            <button
                type="button"
                aria-label="Previous slide"
                onClick={onPrev}
                className="md:w-11 w-10 md:h-11 h-10 btn-black-06 border border-c-black-12 rounded-md flex items-center justify-center"
            >
                <LeftArrowSvg className="w-[17px] h-[17px] stroke-white" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-1" role="tablist" aria-label="Spotlight slides">
                {Array.from({ length: total }).map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={index === activeIndex}
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => onSelect(index)}
                        className={`h-[3px] 3xl:min-w-5 min-w-4 cursor-pointer duration-300 rounded-full
                            ${index === activeIndex ? "3xl:w-9 w-7 bg-c-red-45" : "bg-c-black-20 hover:bg-c-black-30"}`}
                    />
                ))}
            </div>

            <button
                type="button"
                aria-label="Next slide"
                onClick={onNext}
                className="md:w-11 w-10 md:h-11 h-10 btn-black-06 border border-c-black-12 rounded-md flex items-center justify-center"
            >
                <LeftArrowSvg className="w-[17px] h-[17px] stroke-white rotate-180" aria-hidden="true" />
            </button>
        </div>
    );
}

export default CarouselPagination;
