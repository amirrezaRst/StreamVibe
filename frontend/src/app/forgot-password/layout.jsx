import { buildMetadata } from "@/utils/metadata";

//! covers the reset route underneath it too, which carries a one-time token in
//! the path and must never reach an index
export const metadata = buildMetadata({
    title: "Reset your password",
    path: "/forgot-password",
    index: false,
});

const Layout = ({ children }) => children;

export default Layout;
