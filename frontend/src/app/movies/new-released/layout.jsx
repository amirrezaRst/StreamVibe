import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "New Movies",
    description: "Every film newly added to StreamVibe, newest first — with trailers, ratings and reviews.",
    path: "/movies/new-released",
});

const Layout = ({ children }) => children;

export default Layout;
