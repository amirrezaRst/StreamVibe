import { Suspense } from "react";
import BookingDetail from "./BookingDetail";

export const metadata = {
    title: "Your Booking",
    //! a booking belongs to one person and means nothing to anyone else
    robots: { index: false, follow: false },
};

//! useSearchParams inside BookingDetail needs a boundary around it
const BookingDetailPage = ({ params }) => (
    <Suspense>
        <BookingDetail id={params.id} />
    </Suspense>
);

export default BookingDetailPage;
