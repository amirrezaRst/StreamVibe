import AdminGuard from "./AdminGuard";

export const metadata = {
    title: {
        template: "%s · StreamVibe Console",
        default: "StreamVibe Console",
    },
    //! an operations console has no business in a search index
    robots: { index: false, follow: false },
};

const AdminLayout = ({ children }) => <AdminGuard>{children}</AdminGuard>;

export default AdminLayout;
