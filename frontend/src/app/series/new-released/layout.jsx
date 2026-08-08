import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "New Series",
    description: "Every TV series newly added to StreamVibe, newest first — with trailers, ratings and reviews.",
    path: "/series/new-released",
});

const Layout = ({ children }) => children;

export default Layout;
