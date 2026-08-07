import { buildMetadata, titleCase } from "@/utils/metadata";

export const generateMetadata = ({ params: { genre } }) => {
    const name = titleCase(decodeURIComponent(genre));

    return buildMetadata({
        title: `${name} Series`,
        description: `Every ${name.toLowerCase()} TV series on StreamVibe, with trailers, ratings and reviews.`,
        path: `/series/genres/${genre}`,
    });
};

const Layout = ({ children }) => children;

export default Layout;
