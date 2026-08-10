/**
 * Pulls a real Season 1 episode list — title, air date, synopsis, runtime —
 * from English Wikipedia, the same way wikiPoster.js and wikiPersonPhoto.js
 * pull posters and portraits: read the article a human editor would, rather
 * than guessing at an API shortcut that doesn't exist for this either.
 *
 * Most long-running shows split each season into its own article ("Breaking
 * Bad season 1") and the main "List of X episodes" page just transcludes it;
 * shorter shows and miniseries keep the whole episode table on one page.
 * Both are handled — every {{Episode list/sublist}} instance is the same
 * template regardless of which article it lives on.
 */

const USER_AGENT = 'StreamVibePortfolioDemo/1.0 (https://github.com/amirrezaRst/StreamVibe; educational portfolio project)';
const API = 'https://en.wikipedia.org/w/api.php';

const getJson = async (params) => {
    const url = `${API}?${new URLSearchParams({ ...params, format: 'json' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${url}`);
    return res.json();
};

const pageWikitext = async (title, section) => {
    const params = { action: 'query', titles: title, prop: 'revisions', rvprop: 'content', redirects: '1' };
    if (section !== undefined) params.rvsection = section;
    const data = await getJson(params);
    const page = Object.values(data.query?.pages || {})[0];
    if (page?.missing !== undefined) return null;
    return page?.revisions?.[0]?.['*'] || null;
};

const sectionsOf = async (title) => {
    const data = await getJson({ action: 'parse', page: title, prop: 'sections' });
    if (data.error) return null;
    return data.parse.sections;
};

//! a bare show title routinely collides with something else entirely —
//! "Halo" the franchise/word, "Chernobyl" the town — so the canonical
//! article is resolved by search rather than assumed to equal the title
const resolveShowArticle = async (title) => {
    const data = await getJson({ action: 'query', list: 'search', srsearch: `${title} TV series`, srlimit: 1 });
    return data.query?.search?.[0]?.title || title;
};

//! strips the wikitext an editor writes down to the prose a reader sees:
//! [[link|display]] -> display, [[link]] -> link, refs/comments/templates
//! dropped, '' / ''' emphasis markers removed
const cleanWikitext = (text) => {
    if (!text) return '';
    return text
        .replace(/<ref[^>]*\/>/gs, '')
        .replace(/<ref[^>]*>.*?<\/ref>/gs, '')
        .replace(/<!--.*?-->/gs, '')
        .replace(/\{\{efn[^}]*\}\}/gs, '')
        //! a bare (not <ref>-wrapped) {{cite ...}} occasionally sits directly
        //! in running prose — dropped outright rather than left to the
        //! generic template rule below, which would keep "cite web" as text
        .replace(/\{\{[Cc]ite[^{}]*\}\}/g, '')
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
        .replace(/\{\{([^{}|]+)\|[^{}]*\}\}/g, '$1')
        .replace(/\{\{[^{}]*\}\}/g, '')
        .replace(/'''?/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

//! a synopsis running the length of a Wikipedia recap reads wrong as a
//! streaming site's episode description — trimmed to the first couple of
//! sentences, the same "clip on a word boundary" rule buildMetadata uses
const clipSummary = (text, limit = 320) => {
    const clean = cleanWikitext(text);
    if (clean.length <= limit) return clean;
    const cut = clean.slice(0, limit);
    const lastSentence = cut.lastIndexOf('. ');
    const lastSpace = cut.lastIndexOf(' ');
    const boundary = lastSentence > limit * 0.4 ? lastSentence + 1 : lastSpace;
    //! a nested {{template inside a template}} defeats cleanWikitext's
    //! non-recursive stripping and can leave a dangling "{{Cite web" fragment
    //! right at the cut point — dropped rather than shown half-formed
    return `${cut.slice(0, boundary).replace(/\{\{[\s\S]*$/, '').trimEnd()}…`;
};

const parseStartDate = (wikitext) => {
    const m = wikitext.match(/\{\{Start date\|(\d{4})\|0?(\d{1,2})\|0?(\d{1,2})/i);
    if (!m) return null;
    const [, y, mo, d] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d));
};

//! {{Episode list/sublist}} and the older {{Episode list}} share every field
//! name that matters here — this reads whichever template instance appears
const EPISODE_BLOCK = /\{\{Episode list(?:\/sublist)?(?:\|[^\n]*)?\n([\s\S]*?)\n\}\}/g;

const parseEpisodeBlocks = (wikitext) => {
    const episodes = [];
    let match;
    while ((match = EPISODE_BLOCK.exec(wikitext))) {
        const body = match[1];
        //! a param's value ends at the next `| Name =`, whether that boundary
        //! is a newline away (the common case) or crammed onto the same line
        //! (some articles write the whole template as one unbroken line)
        const field = (name) => {
            const re = new RegExp(`\\|\\s*${name}\\s*=\\s*([\\s\\S]*?)(?=\\s*\\|\\s*[A-Za-z][\\w ]*\\s*=|$)`, 'i');
            const m = body.match(re);
            return m ? m[1].trim() : '';
        };

        const numberRaw = field('EpisodeNumber2') || field('EpisodeNumber') || field('No.') || field('no_in_season');
        const number = parseInt(numberRaw, 10);
        if (!number) continue;

        const title = cleanWikitext(field('Title')).replace(/^"|"$/g, '');
        const airDateField = field('OriginalAirDate') || field('AirDate');
        const summary = field('ShortSummary') || field('Aux4');

        episodes.push({
            number,
            title: title || `Episode ${number}`,
            airDate: parseStartDate(airDateField),
            description: summary ? clipSummary(summary) : '',
        });
    }
    return episodes.sort((a, b) => a.number - b.number);
};

//! the per-episode template rarely carries its own runtime — the show's
//! main infobox states a range ("43–58 minutes"); the midpoint stands in
//! for every episode rather than leaving the field unset
const parseRuntime = (wikitext) => {
    const m = wikitext.match(/\|\s*(?:running_time|runtime)\s*=\s*([^\n|]+)/i);
    if (!m) return null;
    const numbers = [...m[1].matchAll(/\d+/g)].map((n) => parseInt(n[0], 10));
    if (!numbers.length) return null;
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
};

//! priority order per host: a "Season 1 (YYYY)" heading is unambiguously the
//! episode list; a bare "Season 1" is second because long-running shows also
//! title a *cast* subsection "Season 1" (The Last of Us, Narcos both do) —
//! preferring the year-suffixed match first avoids landing on that instead.
//! A generic "Episodes" heading is the last resort for single-season shows,
//! and its content isn't guaranteed to stop before "Season 2" starts —
//! callers truncate for that, this just locates the best starting point
const bestSectionOn = (sections) => {
    if (!sections) return null;
    const plain = (line) => line.replace(/<[^>]+>/g, '');
    const dated = sections.find((s) => /^season\s*1\s*\(/i.test(plain(s.line)));
    if (dated) return { index: dated.index, scoped: true };
    const season1 = sections.find((s) => /^season\s*1\b/i.test(plain(s.line)));
    if (season1) return { index: season1.index, scoped: true };
    const episodes = sections.find((s) => /^episodes$/i.test(plain(s.line)));
    if (episodes) return { index: episodes.index, scoped: false };
    return null;
};

//! the "List of X episodes" page almost always drops whatever disambiguating
//! "(TV series)" / "(2023 TV series)" suffix the main article needed
const withoutDisambiguator = (title) => title.replace(/\s*\([^)]*\)\s*$/, '');

const findSeasonOneSection = async (title) => {
    const listCandidates = [...new Set([title, withoutDisambiguator(title)])];
    for (const candidate of listCandidates) {
        const listMatch = bestSectionOn(await sectionsOf(`List of ${candidate} episodes`));
        if (listMatch) return { host: `List of ${candidate} episodes`, ...listMatch };
    }

    //! no dedicated list page (common for a miniseries, or a show still on
    //! its first couple of seasons) — the main article carries it instead
    const mainMatch = bestSectionOn(await sectionsOf(title));
    if (mainMatch) return { host: title, ...mainMatch };

    return null;
};

//! Season 1 content never legitimately contains a "Season 2" heading, so
//! cutting the wikitext there is always safe — needed whenever the section
//! fetched was the broader "Episodes" parent rather than "Season 1" itself
const truncateBeforeNextSeason = (wikitext) => {
    const m = wikitext.match(/\n=+\s*Season\s*2\b/i);
    return m ? wikitext.slice(0, m.index) : wikitext;
};

/**
 * Resolves and parses Season 1 of `showTitle`. Returns null if nothing
 * usable was found rather than throwing — one unusual article shouldn't
 * stop a 34-show batch.
 */
const fetchSeasonOne = async (showTitle) => {
    //! a bare title routinely collides with something unrelated ("Halo" the
    //! franchise, "Chernobyl" the town) — resolved by search up front so
    //! every lookup below targets the actual TV article
    const title = await resolveShowArticle(showTitle);

    const located = await findSeasonOneSection(title);
    if (!located) return null;

    let wikitext = await pageWikitext(located.host, located.index);
    if (!wikitext) return null;
    if (!located.scoped) wikitext = truncateBeforeNextSeason(wikitext);

    //! a season with its own spun-off article ("Breaking Bad season 1")
    //! shows up here as either a bare transclusion marker ({{:Page}}, pulling
    //! the other article's content in directly) or a {{Main|Page}} hatnote
    //! ("see main article", left for a reader to click through) followed by
    //! prose summary instead of a table — either way, not an episode table
    const transclusion = wikitext.match(/\{\{:([^}|]+)\}\}/)
        || wikitext.match(/\{\{Main\s*\|\s*([^|}]+)/i);
    if (transclusion && !EPISODE_BLOCK.test(wikitext)) {
        EPISODE_BLOCK.lastIndex = 0;
        const seasonArticle = transclusion[1].trim();
        const seasonSections = await sectionsOf(seasonArticle);
        const episodesMatch = bestSectionOn(seasonSections);
        wikitext = episodesMatch
            ? await pageWikitext(seasonArticle, episodesMatch.index)
            : await pageWikitext(seasonArticle);
        if (wikitext && !episodesMatch?.scoped) wikitext = truncateBeforeNextSeason(wikitext);
        located.host = seasonArticle;
    }
    EPISODE_BLOCK.lastIndex = 0;

    if (!wikitext) return null;
    const episodes = parseEpisodeBlocks(wikitext);
    if (!episodes.length) return null;

    //! runtime lives on the main show article's infobox, not the season
    //! article's — read it there regardless of where the episodes came from
    const mainWikitext = located.host === title ? wikitext : await pageWikitext(title, 0);
    const runtime = (mainWikitext && parseRuntime(mainWikitext)) || 45;

    return { source: located.host, runtime, episodes };
};

module.exports = { fetchSeasonOne, cleanWikitext, clipSummary };
