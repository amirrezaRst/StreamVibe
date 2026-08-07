import GenresSection from "../explore/movies/GenresSection";
import NewReleasedSection from "../explore/movies/NewReleasedSection";
import PopularMoviesSection from "../explore/movies/PopularMoviesSection";
import TopMovieSection from "../explore/movies/TopMovieSection";
import TrendingMoviesSection from "../explore/movies/TrendingSection";
import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Movies",
    description: "Browse every film on StreamVibe — trending now, newly released, most popular, and the top rated in each genre.",
    path: "/movies",
});

const SeriesPage = () => {
    return (
        <main className="container md:pt-16 pt-5 md:pb-20 pb-10 space-y-16">

            <GenresSection />

            <TopMovieSection />

            <TrendingMoviesSection />

            <NewReleasedSection />

            <PopularMoviesSection />

        </main>
    );
}

export default SeriesPage;