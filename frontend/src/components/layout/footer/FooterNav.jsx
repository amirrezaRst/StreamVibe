import Link from "next/link";

//! every href here is a route that already exists in the app — nothing was
//! invented to fill a slot. "Devices" had no real destination (a device-
//! compatibility page was never built) and was dropped rather than linked
//! to something that isn't actually about devices.
const COLUMNS = [
    {
        title: "Home",
        links: [
            { label: "Categories", href: "/explore" },
            { label: "Pricing", href: "/subscriptions" },
            { label: "FAQ", href: "/support#faq" },
        ],
    },
    {
        title: "Movies",
        links: [
            { label: "Genres", href: "/explore" },
            { label: "Trending", href: "/movies/trending-now" },
            { label: "New Release", href: "/movies/new-released" },
            { label: "Popular", href: "/movies/most-popular" },
        ],
    },
    {
        title: "Shows",
        links: [
            { label: "Genres", href: "/explore" },
            { label: "Trending", href: "/series/trending-now" },
            { label: "New Release", href: "/series/new-released" },
            { label: "Popular", href: "/series/most-popular" },
        ],
    },
    {
        title: "Support",
        links: [
            { label: "Contact Us", href: "/support" },
        ],
    },
    {
        title: "Subscription",
        links: [
            { label: "Plans", href: "/subscriptions" },
            { label: "Features", href: "/subscriptions" },
        ],
    },
];

const FooterNav = () => {
    return (
        <>
            {COLUMNS.map(({ title, links }) => (
                <div key={title}>
                    <p className="3xl:text-[1.45rem] text-white font-semibold mb-3.5">{title}</p>

                    <ul className="3xl:text-xl text-sm text-c-grey-60 space-y-2">
                        {links.map(({ label, href }) => (
                            <li key={label}>
                                <Link href={href} className="hover:text-c-grey-90 duration-150">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </>
    );
}

export default FooterNav;
