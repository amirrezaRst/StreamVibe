import Director from "@/components/singlePage/Director";
import Genres from "@/components/singlePage/Genres";
import Languages from "@/components/singlePage/Languages";
import Musician from "@/components/singlePage/Musician";
import Rating from "@/components/singlePage/Rating";
import ReleasedMovie from "@/components/singlePage/ReleasedMovie";

const Sidebar = ({ releaseDate, language, rating, genres, director, musician, type }) => {
    return (
        <article
            className="lg:col-span-4 col-span-12 bg-c-black-10 border border-c-black-15 rounded-2xl
        xl:py-7 xl:px-7 md:px-5 md:py-5 px-3.5 py-3.5 lg:space-y-7 space-y-5 h-fit"
        >

            <ReleasedMovie year={releaseDate} />
            <Languages languages={[language]} />
            <Rating ratings={rating} />
            <Genres genres={genres} type={type} />
            <Director director={director} />
            {/*//! renders nothing when the title has no composer on record,
                rather than the hardcoded name that used to appear on all of them */}
            <Musician musician={musician} />

        </article>
    );
}

export default Sidebar;