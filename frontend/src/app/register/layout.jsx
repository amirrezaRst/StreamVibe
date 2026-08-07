import { buildMetadata } from "@/utils/metadata";

//! a sign-up form is not a search result anybody wants, and this one doubles as
//! the sign-in page — indexing it only competes with the pages that matter
export const metadata = buildMetadata({
    title: "Sign in",
    description: "Sign in to StreamVibe, or create an account.",
    path: "/register",
    index: false,
});

const Layout = ({ children }) => children;

export default Layout;
