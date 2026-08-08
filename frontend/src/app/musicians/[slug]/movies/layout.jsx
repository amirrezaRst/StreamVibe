import { cache } from "react";

import { fetchMusician } from "@/services/MusicianService";
import { buildMetadata } from "@/utils/metadata";

const load = cache((slug) => fetchMusician(slug));

export const generateMetadata = async ({ params }) => {
    const data = await load(params.slug);
    const musician = data?.musician;
    if (!musician) return buildMetadata({ title: "Not found", index: false });

    return buildMetadata({
        title: `Films Scored by ${musician.fullName}`,
        description: `Every film on StreamVibe scored by ${musician.fullName}, with trailers, ratings and reviews.`,
        path: `/musicians/${params.slug}/movies`,
    });
};

const Layout = ({ children }) => children;

export default Layout;
