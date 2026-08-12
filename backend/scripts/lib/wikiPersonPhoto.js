/**
 * Pulls a real photo for an actor, director or composer from English
 * Wikipedia — the same infobox-reading approach lib/wikiPoster.js uses for
 * film and series posters, adapted for people.
 *
 * People carry one extra risk posters don't: a name collision resolving to
 * the wrong PERSON is a worse, more visible mistake than a poster crop being
 * slightly off. So every candidate page is cross-checked against the birth
 * year already on file before its photo is accepted — a match with no
 * corroborating year is treated as low-confidence and skipped rather than
 * risked.
 */

const USER_AGENT = 'StreamVibePortfolioDemo/1.0 (https://github.com/amirrezaRst/StreamVibe; educational portfolio project)';
const API = 'https://en.wikipedia.org/w/api.php';

const getJson = async (params) => {
    const url = `${API}?${new URLSearchParams({ ...params, format: 'json' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${url}`);
    return res.json();
};

const readSection0 = async (pageTitle) => {
    const data = await getJson({
        action: 'query', titles: pageTitle, prop: 'revisions',
        rvprop: 'content', rvsection: '0', redirects: '1',
    });
    const page = Object.values(data.query?.pages || {})[0];
    return page?.revisions?.[0]?.['*'] || null;
}

const extractImage = (wikitext) => {
    const match = wikitext.match(/\|\s*image\s*=\s*([^\n|]+)/i);
    if (!match) return null;

    const filename = match[1].trim()
        .replace(/<!--.*?-->/gs, '')
        .replace(/^\[\[/, '').replace(/\]\]$/, '')
        .replace(/^File:/i, '')
        .split(/\||\{\{!\}\}/)[0]
        .trim();

    //! a coat of arms, national emblem or "no free image" placeholder is
    //! occasionally what ends up in a person infobox instead of a photo —
    //! none of those are vector files in practice for this kind of subject,
    //! but reject SVGs on the same principle the poster pipeline uses
    return /\.svg$/i.test(filename) ? null : filename;
}

//! the infobox's `birth_date` field is the authority — checked first, and on
//! its own. Falling back to a bare /Born/ scan across the whole intro is what
//! broke this for Robert Zemeckis: Wikipedia's auto-generated short
//! description above the infobox read "(born 1952)", a known-wrong figure
//! that Wikipedia's own infobox two lines down correctly gives as 1951, and
//! a single alternation regex matched whichever "born" occurred first in the
//! text — the wrong one. Two separate, ordered checks instead of one pattern
//! trying to do both jobs.
const matchesBirthYear = (wikitext, year) => {
    if (!year) return true;

    const infoboxField = wikitext.match(/birth_date[^\n]*/i);
    if (infoboxField) return infoboxField[0].includes(String(year));

    const proseIntro = wikitext.slice(0, 2000).match(/\bborn[^\n.]*/i);
    return (proseIntro?.[0] || wikitext.slice(0, 2000)).includes(String(year));
}

//! press photos on Commons are frequently multi-megapixel — Zendaya's and
//! Christopher Nolan's originals ran 14–20MB. iiurlwidth asks for a rendered
//! thumbnail instead of the original file; 800px is comfortably more than
//! the 600x600 crop this ends up as
const resolveFileUrl = async (filename) => {
    const data = await getJson({
        action: 'query', titles: `File:${filename}`, prop: 'imageinfo',
        iiprop: 'url', iiurlwidth: '800',
    });
    const page = Object.values(data.query?.pages || {})[0];
    const info = page?.imageinfo?.[0];
    return info?.thumburl || info?.url || null;
}

const downloadBytes = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Image fetch ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

//! tries a candidate page title; returns bytes only if it both has a real
//! photo and corroborates the birth year
const tryPage = async (pageTitle, birthYear) => {
    if (!pageTitle) return null;
    const wikitext = await readSection0(pageTitle);
    if (!wikitext || !matchesBirthYear(wikitext, birthYear)) return null;

    const filename = extractImage(wikitext);
    if (!filename) return null;

    const fileUrl = await resolveFileUrl(filename);
    return fileUrl ? downloadBytes(fileUrl) : null;
}

/**
 * `role` is a short disambiguating hint ("actor", "film director",
 * "composer") appended to the search query — it is what keeps "Christopher
 * Nolan" landing on the director rather than a namesake. `birthYear` is
 * optional but strongly recommended; without it every candidate is accepted
 * on faith.
 */
const fetchPersonPhoto = async ({ fullName, role, birthYear }) => {
    const search = await getJson({ action: 'query', list: 'search', srsearch: `${fullName} ${role}`, srlimit: 1 });
    const searchTitle = search.query?.search?.[0]?.title;

    const viaSearch = await tryPage(searchTitle, birthYear);
    if (viaSearch) return viaSearch;

    const direct = await getJson({ action: 'query', titles: fullName, redirects: '1' });
    const directPage = Object.values(direct.query?.pages || {})[0];
    if (!directPage || 'missing' in directPage) return null;

    return tryPage(directPage.title, birthYear);
}

module.exports = { fetchPersonPhoto };
