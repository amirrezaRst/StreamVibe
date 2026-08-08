import { buildMetadata } from "@/utils/metadata";

//! the page itself is a client component — it paginates as you scroll — so its
//! metadata has to live in a layout beside it
export const metadata = buildMetadata({
    title: "Trending Movies",
    description: "The films people are watching most on StreamVibe right now, ranked by views this week.",
    path: "/movies/trending-now",
});

const Layout = ({ children }) => children;

export default Layout;
