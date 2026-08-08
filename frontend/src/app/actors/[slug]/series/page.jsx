"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchActorSeries } from "@/services/ActorService";

const ActorSeriesPage = ({ params }) => (
    <PersonCreditsPage
            series
        slug={params.slug}
        collection="series"
        fetcher={fetchActorSeries}
        heading={(name) => `Series starring ${name}`}
    />
);

export default ActorSeriesPage;
