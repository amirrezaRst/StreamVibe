import Link from "next/link";

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
});

const SLOTS_SHOWN = 4;

/**
 * Entry point into the booking flow, shown on a movie page only when that film
 * actually has upcoming screenings — no point advertising a cinema visit for
 * something that isn't playing anywhere.
 */
const CinemaBanner = ({ movieId, cinemas = [] }) => {
    const slots = cinemas.flatMap(entry => entry.showtimes);
    if (!slots.length) return null;

    const next = [...slots].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).slice(0, SLOTS_SHOWN);
    const venues = cinemas.length;

    return (
        <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:py-7 xl:px-7 md:px-5 md:py-5 px-3.5 py-3.5">
            <div className="flex md:flex-row flex-col md:items-center gap-4 justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-c-red-45 shrink-0" />
                        <h4 className="text-white md:text-xl text-lg font-medium">In cinemas now</h4>
                    </div>
                    <p className="text-c-grey-60 2xl:text-base xl:text-super-sm md:text-sm text-super-xs">
                        Playing at {venues} {venues === 1 ? "cinema" : "cinemas"} · {slots.length} upcoming {slots.length === 1 ? "screening" : "screenings"}
                    </p>
                </div>

                <Link
                    href={`/movies/${movieId}/booking`}
                    className="shrink-0 bg-c-red-45 text-white rounded-md md:py-2.5 py-2 3xl:px-8 px-5
                               3xl:text-[1.35rem] md:text-base text-super-sm font-medium text-center
                               hover:bg-[#c40000] transition-colors"
                >
                    Book Tickets
                </Link>
            </div>

            <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-c-black-15">
                {next.map(showtime => (
                    <Link
                        key={showtime._id}
                        href={`/movies/${movieId}/booking`}
                        className="bg-c-black-08 border border-c-black-20 rounded-md py-1.5 px-3 text-super-xs font-bold
                                   text-c-grey-90 tabular-nums hover:border-c-red-45 hover:text-white transition-colors"
                    >
                        {formatTime(showtime.startsAt)}
                    </Link>
                ))}
                {slots.length > SLOTS_SHOWN && (
                    <Link
                        href={`/movies/${movieId}/booking`}
                        className="border border-dashed border-c-black-20 rounded-md py-1.5 px-3 text-super-xs font-bold
                                   text-c-grey-60 hover:text-white transition-colors"
                    >
                        +{slots.length - SLOTS_SHOWN} more
                    </Link>
                )}
            </div>
        </div>
    );
}

export default CinemaBanner;
