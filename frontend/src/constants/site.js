//! One place for the facts every page repeats back to a crawler. They were
//! previously written out by hand in the root layout, which is why the site
//! name in the tab and the site name in the OpenGraph card had drifted apart.
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "StreamVibe";

export const SITE_TAGLINE = "Watch and Discover Movies & TV Shows Online";

export const SITE_DESCRIPTION =
    "Watch and download the latest movies and TV series from around the world in high quality. " +
    "A vast library across every genre, with subtitles and dubbed options, plus cinema tickets you can book in seconds.";

export const DEFAULT_OG_IMAGE = "/images/header-banner-white.jpg";

//! Anything behind a login, or personal to one visitor, has no business in a
//! search index — a booking confirmation carrying somebody's seat numbers least
//! of all. Kept here so robots.txt and the per-page noindex agree.
export const PRIVATE_PATHS = ["/admin", "/profile", "/booking", "/register", "/forgot-password"];
