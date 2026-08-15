"use client";

import MediaListingPage from "@/components/listing/MediaListingPage";
import { getNewReleasedSeries } from "@/services/SeriesService";

const NewReleasedSeriesPage = () => (
    <MediaListingPage
        title="New Released Series"
        fetchPage={getNewReleasedSeries}
        itemsKey="series"
        series
    />
);

export default NewReleasedSeriesPage;
