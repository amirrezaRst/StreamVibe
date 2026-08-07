import { LeftArrowSvg } from "@/assets/Svgs";

const PaginationToggle = ({ containerRef }) => {
    const handleNext = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    
    return (
        <div className="flex gap-2.5">
            <button
                type="button"
                aria-label="Scroll left"
                className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.65rem] h-[2.65rem]"
                onClick={handlePrev}
            >
                <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px]" aria-hidden="true" />
            </button>
            <button
                type="button"
                aria-label="Scroll right"
                className="bg-c-black-08 border border-c-black-15 rounded-full flex items-center justify-center
                    md:w-11 md:h-11 w-[2.65rem] h-[2.65rem]"
                onClick={handleNext}
            >
                <LeftArrowSvg className="stroke-c-grey-60 w-[17px] h-[17px] rotate-180" aria-hidden="true" />
            </button>
        </div>
    );
}

export default PaginationToggle;