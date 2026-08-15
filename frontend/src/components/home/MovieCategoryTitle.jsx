import SlidePagination from "../SlidePagination";

//! showPagination is off while the rail is in its error state — the arrows
//! would still be there to click, scrolling a container that no longer exists
const MovieCategoryTitle = ({ totalSlides, currentIndex, onNext, onPrev, showPagination = true }) => {
    return (
        <div className="flex items-end lg:mb-10 md:mb-8 mb-4">

            <div className="flex-1">
                <h3 className="text-white font-semibold 3xl:text-3xl md:text-2.5xl text-lg mb-3 max-sm:mb-1.5">Explore our wide variety of categories</h3>
                <p className="text-c-grey-60 3xl:text-lg md:text-sm text-xs">
                    Whether you are looking for a comedy to make you laugh, a drama to make you think, or a documentary to learn something new
                </p>
            </div>
            {showPagination && (
                <SlidePagination
                    currentIndex={currentIndex}
                    total={totalSlides}
                    onNext={onNext}
                    onPrev={onPrev}
                />
            )}

        </div>
    );
}

export default MovieCategoryTitle;