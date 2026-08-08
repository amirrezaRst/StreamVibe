import { SITE_NAME, SITE_URL } from "@/constants/site";
import { posterUrl } from "./metadata";

const person = (record) => {
    const name = record?.fullName || record?.name;
    return name ? { "@type": "Person", name } : null;
};

const people = (records) =>
    (Array.isArray(records) ? records : []).map(person).filter(Boolean);

//! schema.org wants a duration as an ISO 8601 period, not a number of minutes
const isoDuration = (minutes) =>
    Number.isFinite(Number(minutes)) && Number(minutes) > 0 ? `PT${Math.round(minutes)}M` : undefined;

//! release_date is a free-text string on both models, so it is anything from
//! "2019" to a full date. Only hand over what parses — a malformed datePublished
//! invalidates the whole block, and no block beats a rejected one.
const isoDate = (value) => {
    if (!value) return undefined;

    const asYear = /^\d{4}$/.test(String(value).trim());
    if (asYear) return `${String(value).trim()}-01-01`;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
};

const rating = (score, count) =>
    Number.isFinite(Number(score)) && Number(score) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(score),
            bestRating: 10,
            worstRating: 0,
            ratingCount: Math.max(Number(count) || 1, 1),
        }
        : undefined;

//! `undefined` values are dropped by JSON.stringify, so every optional field
//! above can simply be left absent rather than guarded at each use
const describe = (media, { type, path, extra = {} }) => ({
    "@context": "https://schema.org",
    "@type": type,
    name: media.title,
    url: `${SITE_URL}${path}`,
    image: posterUrl(media.cover || media.thumbnail),
    description: media.description || undefined,
    datePublished: isoDate(media.release_date),
    genre: media.genres?.length ? media.genres : media.category,
    inLanguage: media.language,
    countryOfOrigin: media.country ? { "@type": "Country", name: media.country } : undefined,
    contentRating: media.age_rating || undefined,
    productionCompany: media.production_company
        ? { "@type": "Organization", name: media.production_company }
        : undefined,
    director: person(media.director) || undefined,
    actor: people(media.actors).length ? people(media.actors) : undefined,
    aggregateRating: rating(media.imdb_rating, media.views),
    award: media.awards?.length ? media.awards.map(item => item.name) : undefined,
    //! no `trailer` VideoObject here — the catalogue has no real trailer
    //! video, and a VideoObject whose contentUrl is a JPEG is exactly the kind
    //! of mismatched structured data a validator flags rather than rewards
    ...extra,
});

export const movieSchema = (movie) =>
    describe(movie, {
        type: "Movie",
        path: `/movies/${movie._id}`,
        extra: { duration: isoDuration(movie.duration) },
    });

export const seriesSchema = (series) =>
    describe(series, {
        type: "TVSeries",
        path: `/series/${series._id}`,
        extra: {
            numberOfSeasons: series.seasons?.length || undefined,
        },
    });

/**
 * The trail a search result shows under the title instead of a bare URL. Worth
 * having on detail pages, where the path a visitor took to get there is not
 * otherwise recoverable from the page itself.
 */
export const breadcrumbSchema = (trail) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: `${SITE_URL}${path}`,
    })),
});

export const siteSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
    },
});
