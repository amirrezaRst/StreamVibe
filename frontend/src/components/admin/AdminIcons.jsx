//! Console-only icons. Every one inherits currentColor so the rail can recolour
//! it as the active section changes — the shared Svgs set mostly bakes in a
//! fill, which would defeat that.
const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    xmlns: "http://www.w3.org/2000/svg",
};

const Icon = ({ children, ...props }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} {...props}>{children}</svg>
);

export const GridIcon = (props) => (
    <Icon {...props}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </Icon>
);

export const FilmIcon = (props) => (
    <Icon {...props}><path d="M3 8.5 20.5 5v12L3 20.5z" /><path d="M3 8.5 20.5 5" /></Icon>
);

export const StackIcon = (props) => (
    <Icon {...props}><rect x="2" y="6" width="20" height="13" rx="2" /><path d="m7 2 5 4 5-4" /></Icon>
);

export const PeopleIcon = (props) => (
    <Icon {...props}>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
        <path d="M17 8.2a3 3 0 0 1 0 5.6" />
        <path d="M18.5 20c0-2.4-.9-4.3-2.2-5.5" />
    </Icon>
);

export const HouseIcon = (props) => (
    <Icon {...props}><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></Icon>
);

export const CalendarIcon = (props) => (
    <Icon {...props}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Icon>
);

export const CardIcon = (props) => (
    <Icon {...props}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icon>
);

export const StarOutlineIcon = (props) => (
    <Icon {...props}><path d="M12 2.5l2.9 5.9 6.6 1-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-1z" /></Icon>
);

export const SearchIcon = (props) => (
    <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);

export const BellIcon = (props) => (
    <Icon {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Icon>
);

export const ExternalIcon = (props) => (
    <Icon {...props}><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></Icon>
);
