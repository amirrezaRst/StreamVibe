import { cache, Suspense } from "react";

import ReviewSection from "@/components/review/ReviewSection";
import CastSection from "@/components/singlePage/CastSection";
import Director from "@/components/singlePage/Director";
import Genres from "@/components/singlePage/Genres";
import Musician from "@/components/singlePage/Musician";
import Rating from "@/components/singlePage/Rating";
import ReleasedMovie from "@/components/singlePage/ReleasedMovie";
import DownloadSection from "../../../../../components/singlePage/DownloadSection";
import WatchPlayer from "@/components/singlePage/WatchPlayer";
import EpisodePageSkeleton from "./EpisodePageSkeleton";
import { fetchSingleEpisode } from "@/services/SeriesService";
import { buildMetadata, posterUrl } from "@/utils/metadata";


const loadEpisode = cache((seriesId, season, episode) =>
    fetchSingleEpisode(seriesId, season, episode));

export const generateMetadata = async ({ params }) => {
    const { slug, season, episode } = params;
    const data = await loadEpisode(slug, season, episode);
    if (!data) return buildMetadata({ title: "Episode not found", index: false });

    //! "Show — S2E5 Title" rather than the episode name alone, which on its own
    //! ("Pilot", "Part One") tells a search result nothing about what it is
    const label = `${data.series?.title} — S${season}E${episode}${data.title ? `: ${data.title}` : ""}`;

    return buildMetadata({
        title: label,
        description: data.description
            || `Watch ${data.series?.title} season ${season}, episode ${episode} in high quality on StreamVibe.`,
        path: `/series/${slug}/${season}/${episode}`,
        image: posterUrl(data.pictures?.[0] || data.series?.cover),
    });
};

const SingleEpisodePage = async ({ params }) => {
    const { slug: seriesId, season, episode } = params;
    const seriesData = await loadEpisode(seriesId, season, episode);

    if (!seriesData) return <EpisodePageSkeleton />;

    const { title, series, pictures, files } = seriesData;
    const { title: seriesTitle, director, release_date, genres, rotten_rating, imdb_rating, actors } = series;


    return (
        <Suspense fallback={<EpisodePageSkeleton />}>
            <main className="container md:pt-10 pt-5 md:pb-20 pb-10">
                <div className="lg:w-[85%] mx-auto space-y-6">

                    <section className="bg-c-black-10 border border-c-black-15 xl:py-9 xl:px-9 md:px-5 md:py-5 px-3.5 py-3.5 rounded-2.5xl">
                        <div className="aspect-video rounded-[0.9rem] overflow-hidden bg-c-black-08">
                            {/*//! the <video> inside needs an explicit height: with
                                no width/height attributes it sizes itself off its
                                *poster* image's own intrinsic ratio (a portrait
                                movie cover) rather than this wrapper's 16:9 box —
                                the element renders far taller than the visible
                                area, pushing the native controls bar below the
                                fold along with most of the poster itself */}
                            <WatchPlayer
                                src="/images/short-video.mp4"
                                poster={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${pictures[0]}`}
                                trailer={series.trailer}
                                title={seriesTitle}
                                qualities={files}
                            />
                        </div>
                        <div className="mt-6">
                            <h1 className="xl:text-3xl md:text-2xl text-lg font-semibold text-white capitalize">
                                {seriesTitle} - Episode {episode}
                            </h1>
                            <p className="mt-2 xl:text-lg md:text-super-base text-sm font-medium text-c-grey-70">
                                Season {season} - Episode {episode}
                            </p>
                            <p className="mt-3 text-c-grey-65 xl:text-lg md:text-super-base text-super-xs tracking-wide">
                                {title}
                            </p>
                        </div>
                    </section>

                    <section className="bg-c-black-10 border border-c-black-15 xl:py-7 xl:px-7 md:px-5 md:py-5 px-3.5 py-3.5 rounded-2.5xl">

                        <h4
                            className="text-white md:text-xl text-super-base font-medium lg:mb-8 md:mb-5 mb-3.5"
                        >
                            Series Info
                        </h4>

                        <Rating custom ratings={[{ source: 'IMDb', score: imdb_rating }, { source: 'Rotten Tomatoes', score: rotten_rating }]} />

                        <div className="grid md:grid-cols-2 md:gap-10 gap-6 mt-8">

                            <Genres custom genres={genres} />

                            <ReleasedMovie custom year={release_date} />

                        </div>

                        <div className="grid md:grid-cols-2 md:gap-10 gap-6 mt-8">

                            <Director custom director={director} />

                            <Musician custom musician={series.musician} />

                        </div>

                    </section>

                    <CastSection actors={actors} />

                    <DownloadSection files={files} seriesTitle={seriesTitle} season={season} episode={episode} />

                    <ReviewSection id={seriesId} />

                </div>
            </main>
        </Suspense>
    );
}

export default SingleEpisodePage;