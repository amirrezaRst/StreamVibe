import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Most Popular Series",
    description: "The most watched TV series on StreamVibe of all time, ranked by total views.",
    path: "/series/most-popular",
});

const Layout = ({ children }) => children;

export default Layout;
