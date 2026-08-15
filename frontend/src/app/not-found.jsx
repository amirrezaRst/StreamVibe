import Link from "next/link";

import FilmStripStage, { ERROR_ACTION_GHOST, ERROR_ACTION_PRIMARY } from "@/components/error/FilmStripStage";
import { HomeIcon } from "@/assets/Svgs";
import { getTrendingMovies } from "@/services/MovieService";
import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Scene Missing",
    description: "This page isn't part of the final cut. Browse the StreamVibe catalogue instead.",
    //! a dead URL must never end up in an index competing with a real page
    index: false,
});

/**
 * Posters make the strip, but this is the page that runs when something is
 * already wrong — so a failure here has to cost nothing. getTrendingMovies
 * swallows its own errors and returns [], and anything that still escapes is
 * caught below; either way the frames fall back to empty dark cells and the
 * page renders exactly the same otherwise. A 404 that throws would be served
 * as a 500, which is both a worse page and a lie about what happened.
 */
const loadPosters = async () => {
    try {
        const data = await getTrendingMovies(1);
        const movies = Array.isArray(data?.movies) ? data.movies : [];
        return movies.map((movie) => movie?.thumbnail).filter(Boolean).slice(0, 4);
    } catch {
        return [];
    }
};

const NotFound = async () => {
    const posters = await loadPosters();

    return (
        <FilmStripStage
            code="404"
            variant="empty"
            title="Scene Missing"
            description="This page isn't part of the final cut. It may have been moved, renamed, or never made it past the edit."
            posters={posters}
        >
            <Link href="/" className={ERROR_ACTION_PRIMARY}>
                <HomeIcon className="md:w-[18px] w-4 h-4" aria-hidden="true" />
                Back to Home
            </Link>
            <Link href="/movies" className={ERROR_ACTION_GHOST}>Browse Movies</Link>
            <Link href="/series" className={ERROR_ACTION_GHOST}>Browse Series</Link>
        </FilmStripStage>
    );
};

export default NotFound;
