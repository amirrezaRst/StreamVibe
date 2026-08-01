import EpisodeItem from "./EpisodeItem";
import SeasonItem from "./SeasonItem";
import { apiFetch } from "@/services/apiClient";

const fetchSeasons = async (id) => {
    const res = await apiFetch(`/season/seasons/${id}`);
    const data = await res.json();
    return data.seasons;
}

const SeasonsSection = async ({ id, seriesTitle }) => {
    const seasons = await fetchSeasons(id);
    return (
        <div
            className="bg-c-black-10 border border-c-black-15 rounded-2xl flex flex-col
                     gap-4 xl:py-7 xl:px-7 md:px-5 md:py-5 px-3.5 py-3.5"
        >
            <h4 className="text-white md:text-xl text-lg font-medium lg:mb-7 md:mb-5 mb-1.5">
                Seasons and Episodes
            </h4>

            <div className="flex flex-col gap-4">
                {seasons?.length > 0 ? seasons.map((season) => (
                    <SeasonItem
                        key={season._id}
                        seasonNumber={season.seasonNumber}
                        episodeCount={season.episodes.length}
                    >
                        {season.episodes.map((episode, index) => (
                            <EpisodeItem
                                key={episode._id}
                                seriesId={id}
                                seriesTitle={seriesTitle}
                                episodeNumber={episode.episodeNumber}
                                seasonNumber={season.seasonNumber}
                                title={episode.title}
                                runtime={episode.runtime}
                                description={episode.description}
                                thumbnail={episode.pictures[0]}
                            />
                        ))}
                    </SeasonItem>
                )) :
                    <p className="text-white 2xl:text-base xl:text-super-sm md:text-sm text-super-xs">
                        This series currently has no episodes.
                    </p>
                }
            </div>
        </div>
    );
}

export default SeasonsSection;