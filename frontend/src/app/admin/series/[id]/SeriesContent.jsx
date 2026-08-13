"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

import { createSeason, fetchSeriesDetail } from "@/services/AdminService";
import PageHeader from "@/components/admin/PageHeader";
import EpisodeDrawer from "@/components/admin/EpisodeDrawer";

const FilesPill = ({ count }) => (
    <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-full shrink-0
        ${count > 0 ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]" : "bg-[#D99A34]/[0.14] text-[#E8B663]"}`}
    >
        {count > 0 ? (count === 1 ? "1 quality" : `${count} qualities`) : "No files"}
    </span>
);

const SeasonBlock = ({ season, seriesId, seriesTitle, onAddEpisode, onEditEpisode, open, onToggle }) => {
    const episodes = season.episodes || [];
    const withFiles = episodes.filter((e) => (e.files || []).length > 0).length;

    return (
        <div className="border border-c-black-15 rounded-[10px] bg-c-black-10 mb-2.5 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-2.5 py-2.5 px-3.5 text-left hover:bg-c-black-12"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`w-3 h-3 text-c-grey-55 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}>
                    <path d="m9 6 6 6-6 6" />
                </svg>
                <span className="flex-1">
                    <span className="text-[13.5px] font-extrabold text-white">Season {season.seasonNumber}</span>
                    <span className="text-[11px] text-c-grey-55 ml-2">
                        {episodes.length} episode{episodes.length === 1 ? "" : "s"} · {withFiles} with files
                    </span>
                </span>
            </button>

            {open && (
                <div className="border-t border-c-black-15 p-2">
                    {episodes.map((episode) => (
                        <div key={episode._id} className="flex items-center gap-3 py-2 px-2.5 rounded-[8px] hover:bg-c-black-12">
                            <span className="w-6 h-6 rounded-[6px] bg-c-black-15 text-c-grey-65 grid place-items-center text-[11px] font-extrabold shrink-0 [font-variant-numeric:tabular-nums]">
                                {episode.episodeNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-c-grey-97 truncate">{episode.title}</p>
                                <p className="text-[10.5px] text-c-grey-55">{episode.runtime} min</p>
                            </div>
                            <FilesPill count={(episode.files || []).length} />
                            <button
                                type="button"
                                onClick={() => onEditEpisode(episode)}
                                className="rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border border-c-black-20 bg-c-black-12 text-c-grey-65 hover:text-c-grey-90 duration-150 shrink-0"
                            >
                                Edit
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => onAddEpisode(season.seasonNumber)}
                        className="flex items-center justify-center gap-1.5 w-full mt-1.5 py-2 rounded-[8px] border-[1.5px] border-dashed border-c-black-25
                            text-[11px] font-bold text-c-grey-60 hover:border-c-red-45 hover:text-c-grey-90 duration-150"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-3 h-3">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add episode to Season {season.seasonNumber}
                    </button>
                </div>
            )}
        </div>
    );
};

const SeriesContent = ({ id }) => {
    const [series, setSeries] = useState(null);
    const [error, setError] = useState(null);
    const [openSeasons, setOpenSeasons] = useState(new Set());
    const [addingSeason, setAddingSeason] = useState(false);
    const [episodeDraft, setEpisodeDraft] = useState(null); // { seasonNumber, episode? }

    const load = useCallback(async () => {
        try {
            const { series: data } = await fetchSeriesDetail(id);
            setSeries(data);
            setError(null);
            //! the newest season is the one an admin most likely came here to
            //! populate, so it opens by default instead of everything collapsed
            setOpenSeasons((current) => {
                if (current.size > 0 || !data.seasons?.length) return current;
                return new Set([data.seasons[data.seasons.length - 1].seasonNumber]);
            });
        } catch (err) {
            setError(err.message);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const toggleSeason = (seasonNumber) => {
        setOpenSeasons((current) => {
            const next = new Set(current);
            next.has(seasonNumber) ? next.delete(seasonNumber) : next.add(seasonNumber);
            return next;
        });
    };

    const addSeason = async () => {
        setAddingSeason(true);
        try {
            await createSeason({ series: id });
            toast.success("Season added");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAddingSeason(false);
        }
    };

    const seasons = series?.seasons || [];
    const totalEpisodes = seasons.reduce((sum, s) => sum + (s.episodes?.length || 0), 0);
    const withFiles = seasons.reduce((sum, s) => sum + (s.episodes || []).filter((e) => (e.files || []).length > 0).length, 0);

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Catalog" }, { label: "Series", href: "/admin/series" }]}
                title={series?.title || "Loading"}
                subtitle={series
                    ? `${seasons.length} season${seasons.length === 1 ? "" : "s"} · ${totalEpisodes} episode${totalEpisodes === 1 ? "" : "s"} · ${withFiles} with video files`
                    : "Loading the series"}
            >
                {series && (
                    <>
                        <Link
                            href={`/admin/series/${id}/edit`}
                            className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold border border-c-black-20
                                bg-c-black-10 text-c-grey-90 hover:border-c-black-25 duration-150"
                        >
                            Edit details
                        </Link>
                        <button
                            type="button"
                            onClick={addSeason}
                            disabled={addingSeason}
                            className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                                text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-50"
                        >
                            {addingSeason ? "Adding…" : "+ Add season"}
                        </button>
                    </>
                )}
            </PageHeader>

            <div className="p-[18px] max-w-[720px]">
                {error && <p className="text-c-grey-60 text-super-sm">{error}</p>}

                {!series && !error && (
                    <div className="flex flex-col gap-2.5">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="h-[46px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
                        ))}
                    </div>
                )}

                {series && seasons.length === 0 && (
                    <div className="border border-dashed border-c-black-20 rounded-xl py-12 text-center">
                        <p className="text-c-grey-90 text-sm font-semibold mb-1">No seasons yet</p>
                        <p className="text-c-grey-60 text-[12.5px] mb-4">
                            An episode can only be created once its season exists.
                        </p>
                        <button
                            type="button"
                            onClick={addSeason}
                            disabled={addingSeason}
                            className="bg-c-red-45 hover:bg-c-red-45/85 text-white rounded-[7px] py-2 px-4 text-xs font-bold duration-150 disabled:opacity-50"
                        >
                            {addingSeason ? "Adding…" : "Add Season 1"}
                        </button>
                    </div>
                )}

                {seasons.map((season) => (
                    <SeasonBlock
                        key={season._id}
                        season={season}
                        seriesId={id}
                        seriesTitle={series.title}
                        open={openSeasons.has(season.seasonNumber)}
                        onToggle={() => toggleSeason(season.seasonNumber)}
                        onAddEpisode={(seasonNumber) => setEpisodeDraft({ seasonNumber })}
                        onEditEpisode={(episode) => setEpisodeDraft({ seasonNumber: episode.seasonNumber, episode })}
                    />
                ))}
            </div>

            {episodeDraft && series && (
                <EpisodeDrawer
                    seriesId={id}
                    seriesTitle={series.title}
                    seasonNumber={episodeDraft.seasonNumber}
                    episode={episodeDraft.episode}
                    nextEpisodeNumber={
                        (seasons.find((s) => s.seasonNumber === episodeDraft.seasonNumber)?.episodes?.length || 0) + 1
                    }
                    onClose={() => setEpisodeDraft(null)}
                    onSaved={() => { setEpisodeDraft(null); load(); }}
                />
            )}
        </>
    );
};

export default SeriesContent;
