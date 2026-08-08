import { buildMetadata, titleCase } from "@/utils/metadata";

//! the listing paginates client-side, so the metadata is generated here in the
//! layout, which still sees the same route params
export const generateMetadata = ({ params: { genre } }) => {
    const name = titleCase(decodeURIComponent(genre));

    return buildMetadata({
        title: `${name} Movies`,
        description: `Every ${name.toLowerCase()} film on StreamVibe, with trailers, ratings and reviews.`,
        path: `/movies/genres/${genre}`,
    });
};

const Layout = ({ children }) => children;

export default Layout;
