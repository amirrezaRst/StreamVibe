import { cache } from "react";
import { notFound } from "next/navigation";

import PersonPage from "@/components/person/PersonPage";
import { fetchActor } from "@/services/ActorService";
import { buildMetadata, posterUrl } from "@/utils/metadata";

const loadActor = cache((slug) => fetchActor(slug));

export const generateMetadata = async ({ params }) => {
    const data = await loadActor(params.slug);
    const actor = data?.actor;
    if (!actor) return buildMetadata({ title: "Actor not found", index: false });

    return buildMetadata({
        title: actor.fullName,
        //! a biography's opening sentence is a better snippet than anything
        //! generated, but a lot of these records have none
        description: actor.bio
            || `Every film and TV series starring ${actor.fullName} on StreamVibe, with trailers, ratings and reviews.`,
        path: `/actors/${actor.slug || params.slug}`,
        image: posterUrl(actor.profile),
    });
};

const SingleActorPage = async ({ params }) => {
    const data = await loadActor(params.slug);
    if (!data || data.status === 404 || !data.actor) return notFound();

    return (
        <PersonPage
            roleKey="actor"
            person={data.actor}
            movies={data.movies}
            series={data.series}
            collaborators={data.collaborators}
        />
    );
}

export default SingleActorPage;
