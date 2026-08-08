import { SITE_URL } from "@/constants/site";
import { apiFetch } from "@/services/apiClient";

//! without this the map is built once at deploy and never again — a film added
//! next week would never appear in it. Hourly is far more often than a crawler
//! asks, and costs one query per collection.
export const revalidate = 3600;

//! A crawler asking for the sitemap should never be the reason a deploy looks
//! broken. If one collection fails to load the rest of the map still ships —
//! a short sitemap is a far smaller problem than a 500 on /sitemap.xml, which
//! Search Console treats as the whole file being unavailable.
const collect = async (path, pick) => {
    try {
        const response = await apiFetch(path);
        if (!response.ok) return [];

        return pick(await response.json()) || [];
    } catch {
        return [];
    }
};

const entry = (path, priority, changeFrequency = "weekly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
});

//! The landing pages people actually arrive on, in the order they matter.
//! Everything private is absent by construction rather than by exclusion —
//! this map is built from the public catalogue and nothing else.
const STATIC_ROUTES = [
    entry("/", 1, "daily"),
    entry("/movies", 0.9, "daily"),
    entry("/series", 0.9, "daily"),
    entry("/explore", 0.8),
    entry("/movies/trending-now", 0.7, "daily"),
    entry("/movies/new-released", 0.7, "daily"),
    entry("/movies/most-popular", 0.7, "daily"),
    entry("/series/trending-now", 0.7, "daily"),
    entry("/series/new-released", 0.7, "daily"),
    entry("/series/most-popular", 0.7, "daily"),
    entry("/subscriptions", 0.6, "monthly"),
    entry("/support", 0.5, "monthly"),
];

const sitemap = async () => {
    const [movies, series, actors, directors, movieGenres, seriesGenres] = await Promise.all([
        collect("/movie", data => data.movies),
        collect("/series", data => data.series),
        collect("/actor/actorList", data => data.actors || data),
        collect("/director/directorList", data => data.directors || data),
        collect("/movie/categories", data => Object.keys(data || {})),
        collect("/series/categories", data => Object.keys(data || {})),
    ]);

    //! Titles are the reason anyone lands here from a search, so they carry the
    //! highest priority of anything generated; a person's filmography page is
    //! worth indexing but is rarely the query itself.
    //!
    //! Slugs only. Both forms resolve, but a sitemap is a statement about which
    //! address is canonical — listing the _id form would invite a crawler to
    //! index the same page twice under two URLs.
    const address = (record) => record.slug || record._id;

    return [
        ...STATIC_ROUTES,
        ...movies.map(movie => entry(`/movies/${address(movie)}`, 0.8)),
        ...series.map(show => entry(`/series/${address(show)}`, 0.8)),
        ...movieGenres.map(genre => entry(`/movies/genres/${encodeURIComponent(genre)}`, 0.6)),
        ...seriesGenres.map(genre => entry(`/series/genres/${encodeURIComponent(genre)}`, 0.6)),
        ...actors.map(actor => entry(`/actors/${address(actor)}`, 0.5, "monthly")),
        ...directors.map(director => entry(`/directors/${address(director)}`, 0.5, "monthly")),
    ];
};

export default sitemap;
