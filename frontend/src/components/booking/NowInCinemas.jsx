import Image from "next/image";
import Link from "next/link";

import { fetchNowPlaying } from "@/services/CinemaService";

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
});

const SLOTS_SHOWN = 3;

/**
 * Films with screenings still to come today. Renders nothing when no cinema is
 * showing anything, so the home page doesn't carry an empty rail.
 */
const NowInCinemas = async ({ city }) => {
    const nowPlaying = await fetchNowPlaying({ city, limit: 8 });
    if (!nowPlaying.length) return null;

    return (
        <section className="container lg:pt-10 md:pt-6 pt-2 pb-6">
            <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-c-red-45 shrink-0" />
                        <h2 className="text-white font-medium 3xl:text-3xl xl:text-2.5xl md:text-2xl text-xl">
                            Now in Cinemas
                        </h2>
                    </div>
                    <p className="text-c-grey-60 3xl:text-xl lg:text-sm text-super-xs">
                        {city ? `Screening in ${city} today` : "Book a seat for tonight"}
                    </p>
                </div>
                <Link href="/movies" className="text-c-red-45 text-super-sm font-bold whitespace-nowrap hover:underline">
                    See all →
                </Link>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                {nowPlaying.map(({ movie, cinemaCount, showtimes }) => (
                    <div
                        key={movie._id}
                        className="bg-c-black-08 border border-c-black-15 rounded-xl p-2.5 hover:border-c-black-25 hover:-translate-y-[3px] transition-all duration-150"
                    >
                        <Link href={`/movies/${movie._id}`}>
                            <div className="w-full aspect-thumbnail rounded-lg overflow-hidden bg-c-black-12">
                                {movie.thumbnail && (
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${movie.thumbnail}`}
                                        alt={movie.title}
                                        width={288} height={324}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <h3 className="text-[14.5px] font-bold text-white mt-2.5 mb-1 px-0.5 leading-tight line-clamp-2">
                                {movie.title}
                            </h3>
                        </Link>
                        <p className="text-xs text-c-grey-60 px-0.5 mb-2.5">
                            {cinemaCount} {cinemaCount === 1 ? "cinema" : "cinemas"}
                        </p>

                        <div className="flex gap-1.5 flex-wrap">
                            {showtimes.slice(0, SLOTS_SHOWN).map(showtime => (
                                <Link
                                    key={showtime._id}
                                    href={`/movies/${movie._id}/booking`}
                                    className="bg-c-black-10 border border-c-black-20 rounded-md py-1 px-2 text-[11.5px] font-bold
                                               text-c-grey-90 tabular-nums hover:border-c-red-45 hover:text-white transition-colors"
                                >
                                    {formatTime(showtime.startsAt)}
                                </Link>
                            ))}
                            {showtimes.length > SLOTS_SHOWN && (
                                <Link
                                    href={`/movies/${movie._id}/booking`}
                                    className="border border-dashed border-c-black-20 rounded-md py-1 px-2 text-[11.5px] font-bold
                                               text-c-grey-60 hover:text-white hover:border-c-black-30 transition-colors"
                                >
                                    +{showtimes.length - SLOTS_SHOWN}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default NowInCinemas;
