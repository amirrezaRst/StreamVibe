import PeopleBrowser from "@/components/person/PeopleBrowser";
import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Directors",
    description: "Browse every director in the StreamVibe catalogue — search by name and open a profile for their full filmography.",
    path: "/directors",
});

const DirectorsPage = () => <PeopleBrowser roleKey="director" />;

export default DirectorsPage;
