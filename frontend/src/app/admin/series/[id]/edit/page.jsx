import TitleForm from "@/components/admin/TitleForm";

export const metadata = { title: "Edit Series" };

const EditSeriesPage = ({ params }) => <TitleForm kind="series" id={params.id} />;

export default EditSeriesPage;
