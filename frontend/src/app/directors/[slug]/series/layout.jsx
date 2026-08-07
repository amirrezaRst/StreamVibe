import { cache } from "react";

import { fetchDirector } from "@/services/DirectorService";
import { buildMetadata } from "@/utils/metadata";

const load = cache((slug) => fetchDirector(slug));

export const generateMetadata = async ({ params }) => {
    const data = await load(params.slug);
    const director = data?.director;
    if (!director) return buildMetadata({ title: "Not found", index: false });

    return buildMetadata({
        title: `Series Directed by ${director.fullName}`,
        description: `Every series on StreamVibe directed by ${director.fullName}, with trailers, ratings and reviews.`,
        path: `/directors/${params.slug}/series`,
    });
};

const Layout = ({ children }) => children;

export default Layout;
