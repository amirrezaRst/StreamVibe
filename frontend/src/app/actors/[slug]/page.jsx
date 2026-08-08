import { fetchActor } from "@/services/ActorService";
import MovieSection from "./MovieSection";
import Biography from "./Biography";
import SeriesSection from "./SeriesSection";
import ActorPageSkeleton from "./ActorPageSkeleton";
import { notFound } from "next/navigation";
import { cache } from "react";
import { buildMetadata, posterUrl } from "@/utils/metadata";


const loadActor = cache((slug) => fetchActor(slug));

export const generateMetadata = async ({ params }) => {
    const data = await loadActor(params.slug);
    const actor = data?.actor;
    if (!actor) return buildMetadata({ title: "Actor not found", index: false });

    return buildMetadata({
        title: actor.fullName,
        //! a biography's opening sentence is a better snippet than anything
        //! generated, but a lot of these records have none
        description: actor.bio
            || `Every film and TV series starring ${actor.fullName} on StreamVibe, with trailers, ratings and reviews.`,
        path: `/actors/${params.slug}`,
        image: posterUrl(actor.profile),
    });
};

const SingleActorPage = async ({ params }) => {
    const { slug } = params;

    const data = await loadActor(slug);

    if (data.status === 404) {
        return notFound();
    }

    if (!data) return <ActorPageSkeleton />;


    const { actor } = data;
    const { movies, series } = data;
    const { fullName, bio, country, birthDate, birthPlace, profile, awards } = actor;

    return (
        <>
            <main className="container md:pt-14 pt-5 md:pb-20 pb-10">
                <div className="grid grid-cols-12 xl:gap-12 md:gap-5 gap-6">

                    <section className="md:col-span-4 col-span-12">
                        <div className="rounded-3xl overflow-hidden relative bg-c-black-15 border-2 border-c-black-15 w-[85%] mx-auto">
                            <img
                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${profile}`}
                                alt={`${fullName} director`}
                                className="aspect-square object-cover rounded-3xl "
                            />
                        </div>
                    </section>

                    <section
                        className="md:col-span-8 col-span-12 space-y-6"
                    >

                        <div
                            className="bg-c-black-10 border border-c-black-15 rounded-2.5xl xl:px-8 xl:py-6 md:px-5 md:py-5 px-3.5 py-3.5"
                        >
                            <h1 className="text-white 3xl:text-2.5xl xl:text-2xl text-xl tracking-wide capitalize">{fullName}</h1>
                            <div className="xl:mt-8 mt-5 space-y-5">

                                <div className="tracking-wide">
                                    <p className="text-c-grey-60 3xl:text-lg xl:text-super-base text-super-sm mb-0.5">Born</p>
                                    <p>
                                        <span className="text-white 3xl:text-base xl:text-super-sm text-sm tracking-wide capitalize">
                                            {`${birthDate}, ${birthPlace}, ${country}`}
                                        </span>
                                    </p>
                                </div>
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

export default SingleActorPage;