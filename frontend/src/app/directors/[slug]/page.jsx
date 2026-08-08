import MovieSection from "./MovieSection";
import Biography from "./Biography";
import SeriesSection from "./SeriesSection";
import { fetchDirector } from "@/services/DirectorService";
import DirectorPageSkeleton from "./DirectorPageSkeleton";
import { cache } from "react";
import { buildMetadata, posterUrl } from "@/utils/metadata";


const loadDirector = cache((slug) => fetchDirector(slug));

export const generateMetadata = async ({ params }) => {
    const data = await loadDirector(params.slug);
    const director = data?.director;
    if (!director) return buildMetadata({ title: "Director not found", index: false });

    return buildMetadata({
        title: director.fullName,
        description: director.bio
            || `Every film and TV series directed by ${director.fullName} on StreamVibe, with trailers, ratings and reviews.`,
        path: `/directors/${director.slug || params.slug}`,
        image: posterUrl(director.profile),
    });
};

const SingleDirectorPage = async ({ params }) => {
    const { slug } = params;

    const data = await loadDirector(slug);

    if (!data) return <DirectorPageSkeleton />;


    const { director } = data;
    const { movies, series } = data;
    const { fullName, bio, country, birthDate, birthPlace, profile, death_date, awards } = director;

    return (
        <>
            <main className="container md:pt-14 pt-5 md:pb-20 pb-10">
                <div className="grid grid-cols-12 xl:gap-12 md:gap-5 gap-6">

                    <section className="md:col-span-4 col-span-12">
                        <div className="rounded-3xl overflow-hidden relative bg-c-black-15 border-2 border-c-black-15 w-[85%] mx-auto">
                            <img
                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${profile}`}
                                alt={`${fullName} director`}
                                className={`aspect-square object-cover rounded-3xl ${death_date && "grayscale"}`}
                            />
                        </div>
                    </section>

                    <section
                        className="md:col-span-8 col-span-12 space-y-6"
                    >

                        <div
                            className="bg-c-black-10 border border-c-black-15 rounded-2.5xl xl:px-8 xl:py-6 md:px-5 md:py-5 px-3.5 py-3.5"
                        >
                            <div className="flex justify-between items-center tracking-wide">
                                <h1 className="text-white 3xl:text-2.5xl xl:text-2xl text-xl capitalize">{fullName}</h1>
                                {death_date &&
                                    <span className="text-super-base text-c-grey-60">Deceased</span>
                                }
                            </div>
                            <div className="xl:mt-8 mt-5 space-y-5">

                                <div className="tracking-wide">
                                    <p className="text-c-grey-60 3xl:text-lg xl:text-super-base text-super-sm mb-0.5">Born</p>
                                    <p>
                                        <span className="text-white 3xl:text-base xl:text-super-sm text-sm tracking-wide capitalize">
                                            {`${birthDate}, ${birthPlace}, ${country}`}
                                        </span>
                                    </p>
                                </div>
                                {death_date &&
                                    <div className="tracking-wide">
                                        <p className="text-c-grey-60 3xl:text-lg xl:text-super-base text-super-sm mb-0.5">Date of Death:</p>
                                        <p>
                                            <span className="text-white 3xl:text-base xl:text-super-sm text-sm tracking-wide capitalize">
                                                {death_date}
                                            </span>
                                        </p>
                                    </div>
                                }
                                <div className="tracking-wide">
                                    <p className="text-c-grey-60 3xl:text-lg xl:text-super-base text-super-sm mb-0.5">Awards</p>
                                    <p className="text-white 3xl:text-base xl:text-super-sm text-sm tracking-wide capitalize">
                                        {awards?.length
                                            ? awards.map((award) => `${award.name} (${award.year})`).join(', ')
                                            : "No awards on record yet"}
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="lg:block hidden">
                            <Biography bio={bio} />
                        </div>
                    </section>
                    <div className="lg:hidden block col-span-12 mb-8">
                        <Biography bio={bio} />
                    </div>
                </div>

                <MovieSection slug={slug} fullName={fullName} moviesData={movies} />

                <SeriesSection slug={slug} fullName={fullName} seriesData={series} />

            </main>
        </>
    );
}

export default SingleDirectorPage;