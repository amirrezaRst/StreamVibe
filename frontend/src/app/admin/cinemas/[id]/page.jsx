import CinemaContent from "./CinemaContent";

export const metadata = { title: "Cinema" };

const CinemaPage = ({ params }) => <CinemaContent id={params.id} />;

export default CinemaPage;
