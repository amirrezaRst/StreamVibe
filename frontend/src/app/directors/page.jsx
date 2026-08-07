import { buildMetadata } from "@/utils/metadata";

//! same as /actors — a placeholder heading, held out of the index until there
//! is a real listing behind it
export const metadata = buildMetadata({
    title: "Directors",
    description: "Browse the directors in the StreamVibe catalogue.",
    path: "/directors",
    index: false,
});

const DirectorsPage = () => {
    return (
        <section>
            <h1>Directors</h1>
        </section>
    );
}

export default DirectorsPage;
