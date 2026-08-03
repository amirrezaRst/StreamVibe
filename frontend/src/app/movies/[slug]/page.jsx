import { Suspense } from "react";

import ReviewSection from "@/components/review/ReviewSection";
import CastSection from "@/components/singlePage/CastSection";
import Description from "@/components/singlePage/Description";
import SinglePageLayout from "@/components/layout/singlePage/SinglePageLayout";
import SinglePageSkeleton from "@/components/layout/singlePage/SinglePageSkeleton";
import { fetchSingleMovies } from "@/services/MovieService";
import DownloadSection from "@/components/singlePage/DownloadSection";
import CinemaBanner from "@/components/booking/CinemaBanner";
import { fetchShowtimesByMovie } from "@/services/CinemaService";

const SingleMovie = async ({ params }) => {
    const { slug } = params;

    const [movieData, screenings] = await Promise.all([
        fetchSingleMovies(slug).then(data => data.movie),
        fetchShowtimesByMovie(slug),
    ]);

    if (!movieData) return <SinglePageSkeleton />;

    const { _id: id, description, title, actors, files } = movieData;

    return (
        <Suspense fallback={<SinglePageSkeleton />}>
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
