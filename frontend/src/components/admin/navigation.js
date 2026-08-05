import {
    BookmarkIcon, EnvelopeIcon, HeartIcon, SeatGridIcon, UserCircleIcon,
} from "@/assets/Svgs";
import {
    CalendarIcon, CardIcon, FilmIcon, GridIcon, HouseIcon, PeopleIcon, StackIcon, StarOutlineIcon,
} from "./AdminIcons";

/**
 * The whole console in one list. Grouped by what a section is *for* rather than
 * by which model backs it — "Box office" holds bookings and payments because
 * that is one job, even though they are two collections.
 *
 * `shortcut` is the second key of a `g …` sequence, shown in the palette so
 * nobody has to guess.
 */
export const NAV_GROUPS = [
    {
        label: "Insight",
        items: [
            { id: "overview", label: "Overview", href: "/admin", icon: GridIcon, shortcut: "o" },
        ],
    },
    {
        label: "Catalog",
        items: [
            { id: "movies", label: "Movies", href: "/admin/movies", icon: FilmIcon, shortcut: "m" },
            { id: "series", label: "Series", href: "/admin/series", icon: StackIcon, shortcut: "e" },
            { id: "people", label: "People", href: "/admin/people", icon: PeopleIcon, shortcut: "p" },
        ],
    },
    {
        label: "Cinema",
        items: [
            { id: "cinemas", label: "Cinemas", href: "/admin/cinemas", icon: HouseIcon, shortcut: "c" },
            { id: "showtimes", label: "Showtimes", href: "/admin/showtimes", icon: CalendarIcon, shortcut: "s" },
        ],
    },
    {
        label: "Box office",
        items: [
            { id: "bookings", label: "Bookings", href: "/admin/bookings", icon: SeatGridIcon, shortcut: "b" },
            { id: "payments", label: "Payments", href: "/admin/payments", icon: CardIcon, shortcut: "y" },
        ],
    },
    {
        label: "Community",
        items: [
            { id: "users", label: "Users", href: "/admin/users", icon: UserCircleIcon, shortcut: "u" },
            { id: "reviews", label: "Reviews", href: "/admin/reviews", icon: StarOutlineIcon, shortcut: "r" },
            { id: "support", label: "Support", href: "/admin/support", icon: EnvelopeIcon, shortcut: "t" },
        ],
    },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);

//! "/admin" would otherwise prefix-match every section, so the overview is
//! matched exactly and everything else by prefix
export const isActive = (item, pathname) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
