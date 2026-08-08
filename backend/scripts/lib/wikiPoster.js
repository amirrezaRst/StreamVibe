/**
 * Pulls a film/series' real theatrical poster from English Wikipedia.
 *
 * Wikipedia's own `pageimages` API deliberately excludes non-free files
 * (posters are almost always tagged "non-free media" with a fair-use
 * rationale scoped to that one article) — so this goes around it the way a
 * human editor would read the page: search for the article, read the
 * `image = ` parameter out of its infobox wikitext, then resolve that
 * filename to a direct upload.wikimedia.org URL.
 *
 * Every request carries a descriptive User-Agent, which Wikipedia's API
 * etiquette requires (unidentified traffic gets rate-limited or blocked).
 */

const USER_AGENT = 'StreamVibePortfolioDemo/1.0 (https://github.com/amirrezaRst/StreamVibe; educational portfolio project)';

const API = 'https://en.wikipedia.org/w/api.php';

const getJson = async (params) => {
    const url = `${API}?${new URLSearchParams({ ...params, format: 'json' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${url}`);
    return res.json();
};

//! Template:Infobox film/television always exposes the poster as `image =`
//! in the article's lead section (section 0) — reading that one field is far
//! more reliable than guessing which of a page's many images is the poster
const readInfoboxImage = async (pageTitle) => {
    const data = await getJson({
        action: 'query', titles: pageTitle, prop: 'revisions',
        rvprop: 'content', rvsection: '0', redirects: '1',
    });
    const page = Object.values(data.query?.pages || {})[0];
    const wikitext = page?.revisions?.[0]?.['*'];
    if (!wikitext) return null;

    const match = wikitext.match(/\|\s*image\s*=\s*([^\n|]+)/i);
    if (!match) return null;

    //! most infoboxes just write the filename, but a few embed full wikilink
    //! markup like [[File:Foo.jpg|thumb]], escape a trailing parameter with
    //! {{!}} (e.g. "Foo.svg{{!}}class=skin-invert"), or trail off into an
    //! editorial HTML comment ("Foo.jpg<!--do not change-->") — strip all
    //! three down to a bare filename
    const filename = match[1].trim()
        .replace(/<!--.*?-->/gs, '')
        .replace(/^\[\[/, '').replace(/\]\]$/, '')
        .replace(/^File:/i, '')
        .split(/\||\{\{!\}\}/)[0]
        .trim();

    //! a handful of shows have no poster and the infobox falls back to a
    //! wordmark instead (Succession's is literally "Succession-logo.svg") —
    //! a logo is the wrong shape and content for a poster slot, so treat it
    //! as no image rather than downloading a title card
    if (/\.svg$/i.test(filename) || /logo/i.test(filename)) return null;

    return filename;
}

//! full-text search first: for a descriptive query like "The Batman 2022
//! film" it reliably lands on the film itself rather than the bare title
//! "The Batman", which redirects to the general "Batman" character page and
//! has no film poster to offer. The exact-title lookup is the fallback, not
//! the first move — used when search's own top hit has no infobox image
//! (the case that motivated this at all: "Pulp Fiction 1994 film" matched
//! the soundtrack article over the film, and the bare title "Pulp Fiction"
//! is what actually resolves straight to it).
//! a long-running series' main article often carries only its wordmark —
//! there's rarely one poster that represents every season — but the
//! individual season articles (e.g. "Stranger Things season 1") usually do
//! have real key-art in their own infobox, which reads fine as a stand-in
//! for the whole show in a single poster slot
const trySeasonOneArticle = async (title) => {
    const search = await getJson({ action: 'query', list: 'search', srsearch: `${title} (season 1)`, srlimit: 1 });
    const searchTitle = search.query?.search?.[0]?.title;
    return searchTitle ? readInfoboxImage(searchTitle) : null;
}

const findPosterFilename = async (title, searchQuery, kind) => {
    const search = await getJson({ action: 'query', list: 'search', srsearch: searchQuery, srlimit: 1 });
    const searchTitle = search.query?.search?.[0]?.title;
    if (searchTitle) {
        const filename = await readInfoboxImage(searchTitle);
        if (filename) return filename;
    }

    const direct = await getJson({ action: 'query', titles: title, redirects: '1' });
    const directPage = Object.values(direct.query?.pages || {})[0];
    if (directPage && !('missing' in directPage)) {
        const filename = await readInfoboxImage(directPage.title);
        if (filename) return filename;
    }

    return kind === 'series' ? trySeasonOneArticle(title) : null;
}

const resolveFileUrl = async (filename) => {
    const data = await getJson({ action: 'query', titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url' });
    const page = Object.values(data.query?.pages || {})[0];
    return page?.imageinfo?.[0]?.url || null;
}

const downloadBytes = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Image fetch ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

/**
 * Returns the poster as a Buffer, or null if any step of the chain came up
 * empty (no search hit, no infobox image, file since deleted, etc.) — a miss
 * here is expected often enough that it's a normal return value, not an
 * exception; callers fall back to generated art.
 */
const fetchWikipediaPoster = async ({ title, year, kind }) => {
    const query = kind === 'series' ? `${title} TV series` : `${title} ${year} film`;

    const filename = await findPosterFilename(title, query, kind);
    if (!filename) return null;

    const fileUrl = await resolveFileUrl(filename);
    if (!fileUrl) return null;

    return downloadBytes(fileUrl);
}

module.exports = { fetchWikipediaPoster };
