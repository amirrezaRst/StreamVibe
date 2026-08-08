const sharp = require('sharp');

/**
 * Generates the poster/cover/avatar art used by the catalogue reseed. Nothing
 * here is a real studio poster — that would mean redistributing copyrighted
 * key art on a public site with no license to do so. Every image is drawn:
 * a deterministic gradient plus a genre-appropriate motif, seeded from the
 * title/name so the same record always produces the same art (the seed
 * script is safe to re-run) and titles in the same genre still look distinct
 * from each other.
 */

const hashSeed = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

//! mulberry32 — small, deterministic, no dependency
const rng = (seed) => {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

//! one palette per genre in the model's enum, tuned to stay in the site's
//! near-black cinematic register rather than reading as a bright swatch
const GENRE_PALETTES = {
    action: { base: '#120C0C', glow: '#E50000', accent: '#E50000', motif: 'slash' },
    adventure: { base: '#0A1210', glow: '#1F6F5C', accent: '#3DA872', motif: 'ridge' },
    animation: { base: '#150E18', glow: '#E5477A', accent: '#D99A34', motif: 'dots' },
    comedy: { base: '#16110A', glow: '#D99A34', accent: '#D99A34', motif: 'sunburst' },
    crime: { base: '#0D0D0F', glow: '#333340', accent: '#8A93A6', motif: 'blinds' },
    documentary: { base: '#0D1013', glow: '#4C8DD9', accent: '#7A93A6', motif: 'grid' },
    drama: { base: '#0E0F14', glow: '#4C5A7A', accent: '#7583A6', motif: 'radial' },
    fantasy: { base: '#120A16', glow: '#7A3D99', accent: '#B266CC', motif: 'rings' },
    horror: { base: '#0A0505', glow: '#8B0000', accent: '#C40000', motif: 'crack' },
    musical: { base: '#150A12', glow: '#E5477A', accent: '#E5477A', motif: 'bars' },
    mystery: { base: '#0A0A14', glow: '#2E2E66', accent: '#5C5C99', motif: 'fog' },
    romance: { base: '#16090D', glow: '#E5477A', accent: '#E58BA3', motif: 'bokeh' },
    'science fiction': { base: '#060F14', glow: '#4C8DD9', accent: '#6FD1E5', motif: 'hex' },
    thriller: { base: '#0A0A0A', glow: '#E50000', accent: '#990000', motif: 'beam' },
    war: { base: '#0F100D', glow: '#6B6B4D', accent: '#8C8C66', motif: 'bands' },
    western: { base: '#170F08', glow: '#D99A34', accent: '#C68642', motif: 'horizon' },
};

const PEOPLE_PALETTE = [
    { glow: '#4C8DD9', accent: '#7DB3EE' },
    { glow: '#5C5C99', accent: '#8B8BC2' },
    { glow: '#3DA872', accent: '#6BC79A' },
    { glow: '#D99A34', accent: '#E8B663' },
    { glow: '#E5477A', accent: '#EE7FA3' },
];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

//! filters shared by every render — grain first (under everything), vignette
//! last (over everything) — kept cheap: one turbulence pass, one radial fade
const filterDefs = () => `
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" stitchTiles="stitch" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0"/>
    </filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="65"/>
    </filter>
`;

//! kept to one soft, low-opacity glow — a second one stacking on top of the
//! first was compounding into a bright, saturated wash instead of a hint of
//! colour on a mostly-dark frame
const glowCircle = (rand, w, h, color, opacity = 0.15) => {
    const cx = w * (0.2 + rand() * 0.6);
    const cy = h * (0.15 + rand() * 0.5);
    const r = Math.max(w, h) * (0.30 + rand() * 0.18);
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}" opacity="${opacity}" filter="url(#soft)"/>`;
};

//! every motif is built from primitive shapes only — lines, circles, polygons
//! — never hand-authored path data
const MOTIFS = {
    slash: (rand, w, h, accent) => {
        let out = '';
        for (let i = 0; i < 4; i++) {
            const x = w * (0.1 + i * 0.28) + rand() * 40;
            out += `<line x1="${x}" y1="${-40}" x2="${x - h * 0.5}" y2="${h + 40}" stroke="${accent}" stroke-width="${6 + rand() * 10}" opacity="${(0.10 + rand() * 0.10).toFixed(2)}"/>`;
        }
        return out;
    },
    ridge: (rand, w, h, accent) => {
        const base = h * (0.62 + rand() * 0.12);
        const pts = [`0,${h}`, `0,${base + 40}`];
        for (let x = 0; x <= w; x += w / 6) pts.push(`${x.toFixed(0)},${(base - Math.abs(Math.sin(x)) * 60 - rand() * 40).toFixed(0)}`);
        pts.push(`${w},${base + 40}`, `${w},${h}`);
        return `<polygon points="${pts.join(' ')}" fill="${accent}" opacity="0.16"/>`;
    },
    dots: (rand, w, h, accent) => {
        let out = '';
        for (let i = 0; i < 26; i++) {
            const x = rand() * w, y = rand() * h, r = 4 + rand() * 10;
            out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${accent}" opacity="${(0.12 + rand() * 0.18).toFixed(2)}"/>`;
        }
        return out;
    },
    sunburst: (rand, w, h, accent) => {
        const cx = w * 0.5, cy = h * 0.32, rays = 14;
        let out = '';
        for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2;
            const r1 = Math.min(w, h) * 0.18, r2 = Math.min(w, h) * 0.62;
            out += `<line x1="${(cx + Math.cos(a) * r1).toFixed(0)}" y1="${(cy + Math.sin(a) * r1).toFixed(0)}" x2="${(cx + Math.cos(a) * r2).toFixed(0)}" y2="${(cy + Math.sin(a) * r2).toFixed(0)}" stroke="${accent}" stroke-width="3" opacity="0.14"/>`;
        }
        return out;
    },
    blinds: (rand, w, h, accent) => {
        let out = '';
        for (let y = -40; y < h; y += 46) out += `<rect x="0" y="${y}" width="${w}" height="18" fill="${accent}" opacity="0.08" transform="skewY(-8)"/>`;
        return out;
    },
    grid: (rand, w, h, accent) => {
        let out = '';
        for (let x = 0; x <= w; x += w / 9) out += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${accent}" stroke-width="1" opacity="0.10"/>`;
        for (let y = 0; y <= h; y += h / 12) out += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${accent}" stroke-width="1" opacity="0.10"/>`;
        return out;
    },
    radial: (rand, w, h, accent) => {
        let out = '';
        for (let i = 3; i >= 1; i--) out += `<circle cx="${w / 2}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.15 * i}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="${(0.10 + i * 0.02).toFixed(2)}"/>`;
        return out;
    },
    rings: (rand, w, h, accent) => {
        let out = '';
        const cx = w * (0.3 + rand() * 0.4), cy = h * (0.3 + rand() * 0.3);
        for (let i = 0; i < 3; i++) out += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(60 + i * 55).toFixed(0)}" fill="none" stroke="${accent}" stroke-width="2" opacity="${(0.20 - i * 0.05).toFixed(2)}"/>`;
        return out;
    },
    crack: (rand, w, h, accent) => {
        let out = '', x = w * (0.3 + rand() * 0.4), y = 0;
        while (y < h) {
            const nx = x + (rand() - 0.5) * 120, ny = y + h / 8;
            out += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${nx.toFixed(0)}" y2="${ny.toFixed(0)}" stroke="${accent}" stroke-width="2" opacity="0.22"/>`;
            x = nx; y = ny;
        }
        return out;
    },
    bars: (rand, w, h, accent) => {
        let out = '';
        const n = 18, bw = w / (n * 1.6);
        for (let i = 0; i < n; i++) {
            const bh = h * (0.08 + rand() * 0.30);
            const x = (w / n) * i + bw / 2;
            out += `<rect x="${x.toFixed(0)}" y="${(h - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${accent}" opacity="0.18"/>`;
        }
        return out;
    },
    fog: (rand, w, h, accent) => {
        let out = '';
        for (let i = 0; i < 5; i++) out += glowCircle(rand, w, h, accent, 0.08);
        return out;
    },
    bokeh: (rand, w, h, accent) => {
        let out = '';
        for (let i = 0; i < 12; i++) {
            const r = 10 + rand() * 34;
            out += `<circle cx="${(rand() * w).toFixed(0)}" cy="${(rand() * h).toFixed(0)}" r="${r.toFixed(0)}" fill="${accent}" opacity="${(0.06 + rand() * 0.12).toFixed(2)}"/>`;
        }
        return out;
    },
    hex: (rand, w, h, accent) => {
        let out = '';
        const size = Math.min(w, h) * 0.09;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 6; col++) {
                const cx = col * size * 1.8 + (row % 2 ? size * 0.9 : 0) - size;
                const cy = row * size * 1.55;
                if (cx > w + size || cy > h + size) continue;
                const pts = Array.from({ length: 6 }, (_, i) => {
                    const a = (Math.PI / 3) * i;
                    return `${(cx + Math.cos(a) * size).toFixed(0)},${(cy + Math.sin(a) * size).toFixed(0)}`;
                }).join(' ');
                out += `<polygon points="${pts}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.10"/>`;
            }
        }
        return out;
    },
    beam: (rand, w, h, accent) => {
        const x = w * (0.35 + rand() * 0.3);
        return `<polygon points="${x},0 ${x + 90},0 ${x - h * 0.5 + 90},${h} ${x - h * 0.5},${h}" fill="${accent}" opacity="0.14"/>`;
    },
    bands: (rand, w, h, accent) => {
        let out = '';
        for (let y = h * 0.5; y < h; y += 34) out += `<rect x="0" y="${y.toFixed(0)}" width="${w}" height="14" fill="${accent}" opacity="0.10"/>`;
        return out;
    },
    horizon: (rand, w, h, accent) => {
        const y = h * 0.62;
        return `<circle cx="${w / 2}" cy="${y}" r="${Math.min(w, h) * 0.28}" fill="${accent}" opacity="0.18"/>` +
            `<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${accent}" opacity="0.08"/>`;
    },
};

const buildArt = ({ seedText, width, height, palette }) => {
    const rand = rng(hashSeed(seedText));
    const motifFn = MOTIFS[palette.motif] || MOTIFS.radial;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
            ${filterDefs()}
            <radialGradient id="vignette" cx="50%" cy="40%" r="72%">
                <stop offset="0%" stop-color="#000000" stop-opacity="0.05"/>
                <stop offset="55%" stop-color="#000000" stop-opacity="0.28"/>
                <stop offset="100%" stop-color="#000000" stop-opacity="0.72"/>
            </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="${palette.base}"/>
        ${glowCircle(rand, width, height, palette.glow)}
        <g>${motifFn(rand, width, height, palette.accent)}</g>
        <rect width="${width}" height="${height}" fill="url(#vignette)"/>
        <rect width="${width}" height="${height}" filter="url(#grain)"/>
    </svg>`;
};

/**
 * Poster art for a movie/series. `genreKeys` is the record's genre array —
 * the first recognised entry drives the palette so the same title always
 * reduces to the same look; `variant` picks the frame size.
 */
const posterSVG = ({ title, genreKeys = [], variant = 'thumbnail' }) => {
    const key = genreKeys.find((g) => GENRE_PALETTES[g]) || 'drama';
    const palette = GENRE_PALETTES[key];
    const size = variant === 'cover' ? { width: 1600, height: 900 } : { width: 576, height: 864 };
    return buildArt({ seedText: `${title}::${variant}`, ...size, palette });
};

/**
 * Avatar art for an actor/director — a neutral, people-specific palette (kept
 * separate from the genre hues so a cast row doesn't read as more posters)
 * plus a centered initials monogram.
 */
const avatarSVG = ({ fullName, size = 600 }) => {
    const rand = rng(hashSeed(fullName));
    const palette = PEOPLE_PALETTE[Math.floor(rand() * PEOPLE_PALETTE.length)];
    const base = buildArt({
        seedText: `${fullName}::avatar`,
        width: size,
        height: size,
        palette: { base: '#141414', glow: palette.glow, accent: palette.accent, motif: 'rings' },
    });

    const initials = fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
    const fontSize = Math.round(size * 0.32);

    //! spliced in rather than re-templated, so the shared grain/vignette stack
    //! above stays the single source of truth for both posters and avatars
    return base.replace('</svg>', `
        <text x="50%" y="${size / 2}" dy="${fontSize * 0.34}" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}"
            fill="#F7F7F8" opacity="0.92">${initials}</text>
    </svg>`);
};

const rasterize = (svg, { quality = 86 } = {}) =>
    sharp(Buffer.from(svg)).jpeg({ quality, mozjpeg: true }).toBuffer();

module.exports = { posterSVG, avatarSVG, rasterize, GENRE_PALETTES };
