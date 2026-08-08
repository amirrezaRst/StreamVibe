"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchActorMovies } from "@/services/ActorService";

const ActorMoviesPage = ({ params }) => (
    <PersonCreditsPage
        slug={params.slug}
        collection="movies"
        fetcher={fetchActorMovies}
        heading={(name) => `Films starring ${name}`}
    />
);

export default ActorMoviesPage;
