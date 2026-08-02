import TopHeader from "@/components/singlePage/TopHeader";
import Sidebar from "./Sidebar";
import SubscriptionBox from "@/components/subscription/SubscriptionBox";

const SinglePageLayout = ({ children, data, type }) => {
    const { _id: id, title, description, cover, language, genres, director, release_date, imdb_rating, rotten_rating } = data;

    return (
        <main className="container py-6">
            {/*//! `kind` is what the watchlist stores against the entry, so it has
                to travel down with the id the button acts on */}
            <TopHeader
                id={id}
                kind={type === "series" ? "Series" : "Movies"}
                title={title}
                description={description}
                cover={cover}
            />

            <section className="grid grid-cols-12 xl:gap-8 lg:gap-4 gap-6 xl:mt-24 md:mt-16 mt-10 mb-12 min-h-screen">

                <article
                    className="lg:col-span-8 col-span-12 space-y-6 max-lg:order-2"
                >

                    {children}

                </article>

                <Sidebar
                    releaseDate={release_date}
                    language={language}
                    rating={[{ source: 'IMDb', score: imdb_rating }, { source: 'Rotten Tomatoes', score: rotten_rating }]}
                    director={director}
                    genres={genres}
                    type={type}
                />

            </section>

            <SubscriptionBox />

        </main>
    );
}

export default SinglePageLayout;