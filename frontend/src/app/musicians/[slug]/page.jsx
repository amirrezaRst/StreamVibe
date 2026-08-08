import { cache } from "react";
import { notFound } from "next/navigation";

import PersonPage from "@/components/person/PersonPage";
import { fetchMusician } from "@/services/MusicianService";
import { buildMetadata, posterUrl } from "@/utils/metadata";

const loadMusician = cache((slug) => fetchMusician(slug));

export const generateMetadata = async ({ params }) => {
    const data = await loadMusician(params.slug);
    const musician = data?.musician;
    if (!musician) return buildMetadata({ title: "Composer not found", index: false });

    return buildMetadata({
        title: musician.fullName,
        description: musician.bio
            || `Every film and TV series scored by ${musician.fullName} on StreamVibe, with trailers, ratings and reviews.`,
        path: `/musicians/${musician.slug || params.slug}`,
        image: posterUrl(musician.profile),
    });
};

const SingleMusicianPage = async ({ params }) => {
    const data = await loadMusician(params.slug);
    if (!data || data.status === 404 || !data.musician) return notFound();

    return (
        <PersonPage
            roleKey="musician"
            person={data.musician}
            movies={data.movies}
            series={data.series}
            collaborators={data.collaborators}
        />
    );
}

export default SingleMusicianPage;
