import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/constants/site";

//! Search results cut a description around 155 characters and a title around
//! 60. Anything past that is not shown, so a title built from a long film name
//! plus a suffix is trimmed on the word rather than mid-syllable.
const clip = (text, limit) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;

    const cut = clean.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

/**
 * Every public page describes itself the same way, so the shape only has to be
 * right once. Pages pass what makes them different — a title, a sentence, the
 * path they live at — and inherit the rest.
 *
 * `path` matters more than it looks: without a canonical, the same film reached
 * through a genre listing and through a search result is two URLs competing
 * with each other for the same query.
 */
export const buildMetadata = ({ title, description, path = "/", image, index = true } = {}) => {
    const heading = title ? clip(title, 60) : `${SITE_NAME} — ${SITE_DESCRIPTION}`;
    const summary = clip(description || SITE_DESCRIPTION, 155);
    const card = image || DEFAULT_OG_IMAGE;

    return {
        title,
        description: summary,
        alternates: { canonical: path },
        openGraph: {
            title: heading,
            description: summary,
            url: `${SITE_URL}${path}`,
            siteName: SITE_NAME,
            images: [{ url: card, width: 1200, height: 630, alt: title || SITE_NAME }],
            type: "website",
            locale: "en_US",
        },
        twitter: {
            card: "summary_large_image",
            title: heading,
            description: summary,
            images: [card],
        },
        robots: index ? undefined : { index: false, follow: false },
    };
};

//! Genres are stored lowercase and the pages rely on CSS to capitalise them,
//! which does nothing for a <title> — a tab reading "action films" looks like a
//! mistake next to every other title on the site.
export const titleCase = (text = "") =>
    String(text).replace(/\b[a-z]/g, letter => letter.toUpperCase());

//! Posters live on the API host, not with the app, so an absolute URL is the
//! only form a crawler on someone else's machine can resolve.
export const posterUrl = (file) =>
    file ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${file}` : undefined;

/**
 * The short blurb under a title in a search result. Falling back to the film's
 * own description is right when there is one, but a lot of the catalogue has
 * none, and an empty description is worse than a generated one — Google writes
 * its own from the page body, usually out of the navigation.
 */
export const describeTitle = ({ title, description, category, year, kind = "movie" }) => {
    if (description?.trim()) return description;

    const genres = Array.isArray(category) ? category.filter(Boolean).join(", ") : category;
    const parts = [year, genres, kind === "series" ? "TV series" : "film"].filter(Boolean);

    return `Watch ${title}${parts.length ? ` — ${parts.join(", ")}` : ""} on ${SITE_NAME}. ` +
        "Stream in high quality, read reviews, and book cinema tickets.";
};
