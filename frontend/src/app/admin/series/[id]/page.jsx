import SeriesContent from "./SeriesContent";

export const metadata = { title: "Series" };

const SeriesPage = ({ params }) => <SeriesContent id={params.id} />;

export default SeriesPage;
