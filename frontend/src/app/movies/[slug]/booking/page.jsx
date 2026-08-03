import { notFound } from "next/navigation";

import BookingBoard from "@/components/booking/BookingBoard";
import { fetchShowtimesByMovie } from "@/services/CinemaService";

//! the showtimes endpoint carries the movie fields this page needs and, unlike
//! /movie/:id, doesn't count a view — browsing showtimes isn't watching
const loadMovie = async (id) => {
    const data = await fetchShowtimesByMovie(id);
    return data?.movie ? data : null;
};

export async function generateMetadata({ params }) {
    const data = await loadMovie(params.slug);
    if (!data) return { title: "Book tickets — StreamVibe" };

    return {
        title: `Book tickets for ${data.movie.title} — StreamVibe`,
        description: `Choose a cinema, showtime and seats for ${data.movie.title}.`,
    };
}

const BookingPage = async ({ params }) => {
    const data = await loadMovie(params.slug);
    if (!data) return notFound();

    return <BookingBoard movie={data.movie} initialShowtimes={data} />;
};

export default BookingPage;
