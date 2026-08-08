"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchDirectorMovies } from "@/services/DirectorService";

const DirectorMoviesPage = ({ params }) => (
    <PersonCreditsPage
        slug={params.slug}
        collection="movies"
        fetcher={fetchDirectorMovies}
        heading={(name) => `Films directed by ${name}`}
    />
);

export default DirectorMoviesPage;
