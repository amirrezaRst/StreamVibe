"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getPopularMovies } from "@/services/MovieService";

const MostPopularMoviesPage = () => (
    <MediaListingPage
        title="Most Popular Movies"
        fetchPage={getPopularMovies}
        itemsKey="movies"
    />
);

export default MostPopularMoviesPage;
