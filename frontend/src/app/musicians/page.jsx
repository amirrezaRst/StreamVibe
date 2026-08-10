import PeopleBrowser from "@/components/person/PeopleBrowser";
import { buildMetadata } from "@/utils/metadata";

export const metadata = buildMetadata({
    title: "Composers",
    description: "Browse every composer in the StreamVibe catalogue — search by name and open a profile for their full scoring credits.",
    path: "/musicians",
});

const MusiciansPage = () => <PeopleBrowser roleKey="musician" />;

export default MusiciansPage;
