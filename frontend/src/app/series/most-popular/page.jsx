"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getPopularSeries } from "@/services/SeriesService";

const MostPopularSeriesPage = () => (
    <MediaListingPage
        title="Most Popular Series"
        fetchPage={getPopularSeries}
        itemsKey="series"
        series
    />
);

export default MostPopularSeriesPage;
