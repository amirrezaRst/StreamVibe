import Carousel from "@/components/carousel/Carousel";
import SubscriptionBox from "@/components/subscription/SubscriptionBox";
import MovieArticle from "./movies/MovieArticle";
import SeriesArticle from "./series/SeriesArticle";
import { buildMetadata } from "@/utils/metadata";
import { fetchSpotlight } from "@/services/SpotlightService";

export const metadata = buildMetadata({
    title: "Explore",
    description: "Explore the StreamVibe catalogue by genre — action, drama, horror, science fiction and more, across both films and series.",
    path: "/explore",
});

//! without this the spotlight fetch runs once at build time and gets baked
//! into the static page — an admin reordering or toggling a slide would see
//! nothing change on the live site until the next deploy rebuilt it
export const revalidate = 60;


const ExplorePage = async () => {
    const slides = await fetchSpotlight();

    return (
        <main className="container mt-6 mb-40">

            <Carousel slides={slides} />

            <section className="xl:mt-32 md:mt-28 mt-16 space-y-32 mb-20">

                <MovieArticle />

                <SeriesArticle />

            </section>
            <SubscriptionBox />

        </main>
    );
}

export default ExplorePage;