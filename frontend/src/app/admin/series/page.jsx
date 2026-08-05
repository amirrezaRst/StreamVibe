import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Series" };

const SeriesPage = () => (
    <NotBuiltYet
        title="Series"
        crumbs={[{ label: "Catalog" }]}
        describes="Series, their seasons and episodes"
    />
);

export default SeriesPage;
