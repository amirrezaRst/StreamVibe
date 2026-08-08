"use client";

import PersonCreditsPage from "@/components/person/PersonCreditsPage";
import { fetchMusicianMovies } from "@/services/MusicianService";

const MusicianMoviesPage = ({ params }) => (
    <PersonCreditsPage
        slug={params.slug}
        collection="movies"
        fetcher={fetchMusicianMovies}
        heading={(name) => `Films scored by ${name}`}
    />
);

export default MusicianMoviesPage;
