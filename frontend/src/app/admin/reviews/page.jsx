import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Reviews" };

const ReviewsPage = () => (
    <NotBuiltYet
        title="Reviews"
        crumbs={[{ label: "Community" }]}
        describes="Moderate what people wrote"
    />
);

export default ReviewsPage;
