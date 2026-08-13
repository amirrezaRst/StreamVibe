import TitleForm from "@/components/admin/TitleForm";

export const metadata = { title: "Edit Movie" };

const EditMoviePage = ({ params }) => <TitleForm kind="movie" id={params.id} />;

export default EditMoviePage;
