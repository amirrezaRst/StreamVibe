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

        const titleField = field('Title');
        const title = cleanWikitext(titleField).replace(/^"|"$/g, '');
        const airDateField = field('OriginalAirDate') || field('AirDate');
        const summary = field('ShortSummary') || field('Aux4');

        //! some episodes (often the premiere and finale, sometimes the whole
        //! season for a well-documented show) are wikilinked to their own
        //! article — [[Pilot (Breaking Bad)|Pilot]] or plain [[Cat's in the
        //! Bag...]] — which is where a real per-episode runtime can be read
        //! from; plain unlinked text means no such article exists
        const wikilink = titleField.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
        const articleTitle = wikilink ? wikilink[1].trim() : null;

        episodes.push({
            number,
            title: title || `Episode ${number}`,
            articleTitle,
            airDate: parseStartDate(airDateField),
            description: summary ? clipSummary(summary) : '',
        });
    }
    return episodes.sort((a, b) => a.number - b.number);
};

//! the per-episode template rarely carries its own runtime — the show's
//! main infobox states a range ("43–58 minutes"); the midpoint stands in
//! for every episode that doesn't have its own article (see below) to read
//! an exact figure from
const parseRuntime = (wikitext) => {
    const m = wikitext.match(/\|\s*(?:running_time|runtime)\s*=\s*([^\n|]+)/i);
    if (!m) return null;
    const numbers = [...m[1].matchAll(/\d+/g)].map((n) => parseInt(n[0], 10));
    if (!numbers.length) return null;
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
};

//! {{Infobox television episode}} states its own exact runtime as `length`
//! ("58 minutes") rather than the show-wide infobox's `running_time` range
const parseEpisodeLength = (wikitext) => {
    const m = wikitext.match(/\|\s*length\s*=\s*([^\n|]+)/i);
    if (!m) return null;
    const numbers = [...m[1].matchAll(/\d+/g)].map((n) => parseInt(n[0], 10));
    if (!numbers.length) return null;
    //! "42-45 minutes" for a single episode is rare but not unheard of —
    //! same midpoint treatment as the show-wide range
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
};

//! only episodes wikilinked to their own article (see parseEpisodeBlocks)
//! get a lookup at all — most don't, and that's the norm, not a failure
const fetchEpisodeRuntime = async (articleTitle) => {
    try {
        const wikitext = await pageWikitext(articleTitle, 0);
        return wikitext ? parseEpisodeLength(wikitext) : null;
    } catch {
        return null;
    }
};

//! priority order per host: a "Season 1 (YYYY)" heading is unambiguously the
//! episode list; a bare "Season 1" is second because long-running shows also
//! title a *cast* subsection "Season 1" (The Last of Us, Narcos both do) —
//! preferring the year-suffixed match first avoids landing on that instead.
//! A generic "Episodes" heading is the last resort for single-season shows,
//! and its content isn't guaranteed to stop before "Season 2" starts —
//! callers truncate for that, this just locates the best starting point
//! British shows say "Series 1", not "Season 1" (Sherlock, Black Mirror,
//! Peaky Blinders all do); a show split into staggered international
//! releases (Money Heist) says "Part 1" instead — same heading, same
//! meaning, different word each time
const SEASON_WORD = '(?:season|series|part)';
const bestSectionOn = (sections) => {
    if (!sections) return null;
    const plain = (line) => line.replace(/<[^>]+>/g, '');
    const dated = new RegExp(`^${SEASON_WORD}\\s*1\\s*[:(]`, 'i');
    const bare = new RegExp(`^${SEASON_WORD}\\s*1\\b`, 'i');
    const datedMatch = sections.find((s) => dated.test(plain(s.line)));
    if (datedMatch) return { index: datedMatch.index, scoped: true };
    const season1 = sections.find((s) => bare.test(plain(s.line)));
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

//! Season 1 content never legitimately contains a "Season 2"/"Series 2"
//! heading, so cutting there is always safe — applied unconditionally as a
//! safety net, not just for the unscoped "Episodes" fallback, because a few
//! shows (Money Heist's "Season 1: Parts 1 and 2") turned out to nest a
//! second season's heading inside what MediaWiki still reports as one
//! section rather than stopping cleanly at the fetched section's boundary
const truncateBeforeNextSeason = (wikitext) => {
    const m = wikitext.match(new RegExp(`\\n=+\\s*${SEASON_WORD}\\s*2\\b`, 'i'));
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
    wikitext = truncateBeforeNextSeason(wikitext);

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
        if (wikitext) wikitext = truncateBeforeNextSeason(wikitext);
        located.host = seasonArticle;
    }
    EPISODE_BLOCK.lastIndex = 0;

    if (!wikitext) return null;
    const episodes = parseEpisodeBlocks(wikitext);
    if (!episodes.length) return null;

    //! the show-wide runtime lives on the main article's infobox, not the
    //! season article's — read it there regardless of where the episodes
    //! came from, as the fallback for episodes with no article of their own
    const mainWikitext = located.host === title ? wikitext : await pageWikitext(title, 0);
    const defaultRuntime = (mainWikitext && parseRuntime(mainWikitext)) || 45;

    //! one lookup per wikilinked episode, sequentially and rate-limited by
    //! the caller between fetchSeasonOne calls — not everything at once,
    //! since a well-documented show can wikilink every episode in a season
    for (const episode of episodes) {
        episode.runtime = episode.articleTitle
            ? (await fetchEpisodeRuntime(episode.articleTitle)) || defaultRuntime
            : defaultRuntime;
        delete episode.articleTitle;
    }

    return { source: located.host, runtime: defaultRuntime, episodes };
};

module.exports = { fetchSeasonOne, cleanWikitext, clipSummary };
