/**
 * Public URLs address a title or a person by slug rather than by its Mongo
 * _id: `/movies/inception` instead of `/movies/666ec9ee186cb727d066e787`.
 *
 * A slug is generated once, when the record is created, and then left alone.
 * Renaming a film must not silently change its address — anything already
 * linked or indexed would break — so an existing slug is never recomputed
 * from a new title.
 */

const slugify = (text) => String(text || '')
    .normalize('NFKD')
    //! strip the accents NFKD just split off, so "Amélie" becomes "amelie"
    //! rather than "am-lie"
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Finds a slug nothing else is using. Two films can legitimately share a
 * title (Dune 1984 and Dune 2021), so the year disambiguates first — it's
 * the thing a person would actually add — and a counter only comes out when
 * even that collides.
 */
const uniqueSlug = async (Model, text, { year, excludeId } = {}) => {
    const base = slugify(text) || 'untitled';

    const taken = async (candidate) => {
        const query = { slug: candidate };
        if (excludeId) query._id = { $ne: excludeId };
        return Boolean(await Model.exists(query));
    };

    if (!await taken(base)) return base;

    const withYear = year ? `${base}-${String(year).slice(0, 4)}` : null;
    if (withYear && !await taken(withYear)) return withYear;

    const stem = withYear || base;
    for (let suffix = 2; suffix < 500; suffix += 1) {
        const candidate = `${stem}-${suffix}`;
        if (!await taken(candidate)) return candidate;
    }

    throw new Error(`Could not find a free slug for "${text}"`);
};

module.exports = { slugify, uniqueSlug };
