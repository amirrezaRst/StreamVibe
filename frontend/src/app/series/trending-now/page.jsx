"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getTrendingSeries } from "@/services/SeriesService";

const TrendingSeriesPage = () => (
    <MediaListingPage
        title="Trending Series Now"
        fetchPage={getTrendingSeries}
        itemsKey="series"
        series
    />
);

export default TrendingSeriesPage;
