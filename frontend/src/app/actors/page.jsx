import PeopleBrowser from "@/components/person/PeopleBrowser";
import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Actors",
    description: "Browse every actor in the StreamVibe catalogue — search by name and open a profile for their full filmography.",
    path: "/actors",
});

const ActorsPage = () => <PeopleBrowser roleKey="actor" />;

export default ActorsPage;
