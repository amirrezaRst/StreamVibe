"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchMusicianSeries } from "@/services/MusicianService";

const MusicianSeriesPage = ({ params }) => (
    <PersonCreditsPage
            series
        slug={params.slug}
        collection="series"
        fetcher={fetchMusicianSeries}
        heading={(name) => `Series scored by ${name}`}
    />
);

export default MusicianSeriesPage;
