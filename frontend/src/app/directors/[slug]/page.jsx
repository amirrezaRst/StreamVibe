import { cache } from "react";
import { notFound } from "next/navigation";

import PersonPage from "@/components/person/PersonPage";
import { fetchDirector } from "@/services/DirectorService";
import { buildMetadata, posterUrl } from "@/utils/metadata";

const loadDirector = cache((slug) => fetchDirector(slug));

export const generateMetadata = async ({ params }) => {
    const data = await loadDirector(params.slug);
    const director = data?.director;
    if (!director) return buildMetadata({ title: "Director not found", index: false });

    return buildMetadata({
        title: director.fullName,
        description: director.bio
            || `Every film and TV series directed by ${director.fullName} on StreamVibe, with trailers, ratings and reviews.`,
        path: `/directors/${director.slug || params.slug}`,
        image: posterUrl(director.profile),
    });
};

const SingleDirectorPage = async ({ params }) => {
    const data = await loadDirector(params.slug);
    if (!data || data.status === 404 || !data.director) return notFound();

    return (
        <PersonPage
            roleKey="director"
            person={data.director}
            movies={data.movies}
            series={data.series}
            collaborators={data.collaborators}
        />
    );
}

export default SingleDirectorPage;
