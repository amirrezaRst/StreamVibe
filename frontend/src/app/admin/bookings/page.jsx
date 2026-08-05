import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Bookings" };

const BookingsPage = () => (
    <NotBuiltYet
        title="Bookings"
        crumbs={[{ label: "Box office" }]}
        describes="Every reservation, held or settled"
    />
);

export default BookingsPage;
