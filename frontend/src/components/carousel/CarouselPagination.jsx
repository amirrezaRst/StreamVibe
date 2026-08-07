import { LeftArrowSvg } from "@/assets/Svgs";

const CarouselPagination = () => {
    return (
        <div className="w-full flex items-center justify-between md:px-8 px-4 md:mt-7 mt-5">
            <button
                type="button"
                aria-label="Previous"
                className="md:w-11 w-10 md:h-11 h-10 btn-black-06 border border-c-black-12 rounded-md flex items-center justify-center"
            >
                <LeftArrowSvg className="w-[17px] h-[17px] stroke-white" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1">
                <div className="h-[3px] 3xl:min-w-5 min-w-4 cursor-pointer duration-300 rounded-full 3xl:w-9 w-7 bg-c-red-45"></div>
                <div className="h-[3px] 3xl:min-w-5 min-w-4 cursor-pointer duration-300 rounded-full bg-c-black-20"></div>
                <div className="h-[3px] 3xl:min-w-5 min-w-4 cursor-pointer duration-300 rounded-full bg-c-black-20"></div>
                <div className="h-[3px] 3xl:min-w-5 min-w-4 cursor-pointer duration-300 rounded-full bg-c-black-20"></div>
            </div>
            <button
                type="button"
                aria-label="Next"
                className="md:w-11 w-10 md:h-11 h-10 btn-black-06 border border-c-black-12 rounded-md flex items-center justify-center"
            >
                <LeftArrowSvg className="w-[17px] h-[17px] stroke-white rotate-180" aria-hidden="true" />
            </button>
        </div>
    );
}

export default CarouselPagination;