import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Most Popular Movies",
    description: "The most watched films on StreamVibe of all time, ranked by total views.",
    path: "/movies/most-popular",
});

const Layout = ({ children }) => children;

export default Layout;
