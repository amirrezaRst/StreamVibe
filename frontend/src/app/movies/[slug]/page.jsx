import { cache, Suspense } from "react";

import ReviewSection from "@/components/review/ReviewSection";
import CastSection from "@/components/singlePage/CastSection";
import Description from "@/components/singlePage/Description";
import SinglePageLayout from "@/components/layout/singlePage/SinglePageLayout";
import SinglePageSkeleton from "@/components/layout/singlePage/SinglePageSkeleton";
import { fetchSingleMovies } from "@/services/MovieService";
import DownloadSection from "@/components/singlePage/DownloadSection";
import CinemaBanner from "@/components/booking/CinemaBanner";
import JsonLd from "@/components/seo/JsonLd";
import { fetchShowtimesByMovie } from "@/services/CinemaService";
import { buildMetadata, describeTitle, posterUrl } from "@/utils/metadata";
import { breadcrumbSchema, movieSchema } from "@/utils/structuredData";

/**
 * Memoised for the length of one request because this endpoint is not a plain
 * read — it increments the film's view count. generateMetadata and the page
 * body both need the record, and without this every visit would be counted
 * twice.
 */
const loadMovie = cache(async (slug) => {
    const { movie } = await fetchSingleMovies(slug);
    return movie;
});

export const generateMetadata = async ({ params }) => {
    const movie = await loadMovie(params.slug);
    if (!movie) return buildMetadata({ title: "Film not found", index: false });

    return buildMetadata({
        title: movie.title,
        description: describeTitle({ ...movie, year: movie.release_date }),
        path: `/movies/${params.slug}`,
        image: posterUrl(movie.cover || movie.thumbnail),
    });
};

const SingleMovie = async ({ params }) => {
    const { slug } = params;

    const [movieData, screenings] = await Promise.all([
        loadMovie(slug),
        fetchShowtimesByMovie(slug),
    ]);

    if (!movieData) return <SinglePageSkeleton />;

    const { _id: id, description, title, actors, files } = movieData;

    return (
        <Suspense fallback={<SinglePageSkeleton />}>
            <JsonLd data={movieSchema(movieData)} />
            <JsonLd data={breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Movies", path: "/movies" },
                { name: title, path: `/movies/${slug}` },
            ])} />

            <SinglePageLayout
                data={movieData}
            >

                {/*//! Cinema Booking Section */}
                <CinemaBanner movieId={id} cinemas={screenings?.cinemas} />

                {/*//! Description Section */}
                <Description description={description} />

                {/*//! Cast Section */}
                <CastSection actors={actors} />

                <DownloadSection files={files} seriesTitle={title} moviePage />

                {/*//! Previews Section */}
                <ReviewSection id={id} />
            </SinglePageLayout>
        </Suspense>
    );
}

export default SingleMovie;
