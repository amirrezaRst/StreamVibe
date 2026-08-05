import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Movies" };

const MoviesPage = () => (
    <NotBuiltYet
        title="Movies"
        crumbs={[{ label: "Catalog" }]}
        describes="Every film in the catalog"
    />
);

export default MoviesPage;
