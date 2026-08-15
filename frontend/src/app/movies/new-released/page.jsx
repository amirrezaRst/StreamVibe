"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getNewReleasedMovies } from "@/services/MovieService";

const NewReleasedMoviesPage = () => (
    <MediaListingPage
        title="New Released Movies"
        fetchPage={getNewReleasedMovies}
        itemsKey="movies"
    />
);

export default NewReleasedMoviesPage;
