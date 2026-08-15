"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getTrendingMovies } from "@/services/MovieService";

const TrendingMoviePage = () => (
    <MediaListingPage
        title="Trending Movies Now"
        fetchPage={getTrendingMovies}
        itemsKey="movies"
    />
);

export default TrendingMoviePage;
