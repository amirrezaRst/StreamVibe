import HallEditor from "./HallEditor";

export const metadata = { title: "Seat map" };

const HallPage = ({ params }) => <HallEditor cinemaId={params.id} hallId={params.hallId} />;

export default HallPage;
