import { fetchGenreMovies } from "@/services/MovieService";
import { fetchGenreSeries } from "@/services/SeriesService";
import MovieGenreSection from "./MovieGenreSection";
import SeriesGenreSection from "./SeriesGenreSection";
import { buildMetadata, titleCase } from "@/utils/metadata";

export const generateMetadata = ({ params: { genres } }) => {
    const genre = titleCase(decodeURIComponent(genres));

    return buildMetadata({
        title: `${genre} Films & Series`,
        description: `Every ${genre} film and TV series on StreamVibe, with trailers, ratings and reviews.`,
        path: `/explore/${genres}`,
    });
};


const SingleGenresPage = async ({ params: { genres } }) => {
    const { movies } = await fetchGenreMovies(genres);
    const { series } = await fetchGenreSeries(genres);

    return (
        <main className="container lg:py-20 py-12 space-y-32">
            <MovieGenreSection movies={movies} genres={genres} />
            <SeriesGenreSection series={series} genres={genres} />
        </main>
    );
}

export default SingleGenresPage;