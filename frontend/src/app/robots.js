import { PRIVATE_PATHS, SITE_URL } from "@/constants/site";

/**
 * This replaced a static robots.txt that said `Disallow: /` — the whole site,
 * every crawler. That is the right file to ship while a site is still being
 * built and the wrong one to leave behind once it is live, and it had been left
 * behind. Nothing public was reachable from a search result.
 *
 * Generated rather than static so the sitemap URL follows the deployment
 * instead of being pinned to whichever host was current when it was written.
 */
const robots = () => ({
    rules: {
        userAgent: "*",
        allow: "/",
        //! no trailing slash: robots.txt matches on prefix, so "/profile"
        //! covers both the page itself and everything under it, where
        //! "/profile/" would quietly leave the page itself crawlable
        disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
});

export default robots;
