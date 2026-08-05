import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Showtimes" };

const ShowtimesPage = () => (
    <NotBuiltYet
        title="Showtimes"
        crumbs={[{ label: "Cinema" }]}
        describes="The screening schedule"
    />
);

export default ShowtimesPage;
