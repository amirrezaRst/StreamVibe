import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Trending Series",
    description: "The TV series people are watching most on StreamVibe right now, ranked by views this week.",
    path: "/series/trending-now",
});

const Layout = ({ children }) => children;

export default Layout;
