"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchDirectorSeries } from "@/services/DirectorService";

const DirectorSeriesPage = ({ params }) => (
    <PersonCreditsPage
            series
        slug={params.slug}
        collection="series"
        fetcher={fetchDirectorSeries}
        heading={(name) => `Series directed by ${name}`}
    />
);

export default DirectorSeriesPage;
