import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "People" };

const PeoplePage = () => (
    <NotBuiltYet
        title="People"
        crumbs={[{ label: "Catalog" }]}
        describes="Actors and directors"
    />
);

export default PeoplePage;
