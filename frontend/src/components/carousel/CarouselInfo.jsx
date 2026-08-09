const CarouselInfo = ({ title, description }) => {
    return (
        <>
            <h2 className="carousel-rise text-white font-semibold md:text-2.5xl text-1.5xl">
                {title}
            </h2>
            <p
                className="carousel-rise text-[#bbbbbb] lg:text-sm md:text-super-xs text-xs line-clamp-3 md:mb-6 mb-2 lg:w-8/12 md:w-4/5 max-md:px-2.5 mx-auto"
                style={{ animationDelay: "90ms" }}
            >
                {description}
            </p>
        </>
    );
}

export default CarouselInfo;
