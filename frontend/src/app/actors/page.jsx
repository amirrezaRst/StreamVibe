import { buildMetadata } from "@/utils/metadata";

//! this page is a heading and nothing else — a placeholder that was never
//! filled in. Kept out of the index deliberately: a thin page in a search
//! result is worse for the site than no page at all. The individual actor
//! pages underneath it are real and are indexed.
export const metadata = buildMetadata({
    title: "Actors",
    description: "Browse the actors in the StreamVibe catalogue.",
    path: "/actors",
    index: false,
});

const ActorsPage = () => {
    return (
        <section>
            <h1>Actors</h1>
        </section>
    );
}

export default ActorsPage;
