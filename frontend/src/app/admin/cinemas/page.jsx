import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Cinemas" };

const CinemasPage = () => (
    <NotBuiltYet
        title="Cinemas"
        crumbs={[{ label: "Cinema" }]}
        describes="Venues, halls and their seat maps"
    />
);

export default CinemasPage;
