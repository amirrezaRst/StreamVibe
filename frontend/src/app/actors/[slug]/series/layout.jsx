import { cache } from "react";

import { fetchActor } from "@/services/ActorService";
import { buildMetadata } from "@/utils/metadata";

const load = cache((slug) => fetchActor(slug));

export const generateMetadata = async ({ params }) => {
    const data = await load(params.slug);
    const actor = data?.actor;
    if (!actor) return buildMetadata({ title: "Not found", index: false });

    return buildMetadata({
        title: `Series Starring ${actor.fullName}`,
        description: `Every series on StreamVibe starring ${actor.fullName}, with trailers, ratings and reviews.`,
        path: `/actors/${params.slug}/series`,
    });
};

const Layout = ({ children }) => children;

export default Layout;
