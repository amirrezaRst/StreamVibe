"use client"
import { DownloadIcon, LockIcon } from "@/assets/Svgs";
import { isQualityWithinPlan } from "@/constants/PlanAccess";
import { downloadMovieApi } from "@/services/MovieService";
import { downloadEpisodeApi } from "@/services/SeriesService";
import { useState } from "react";

//! bytes on disk, as multer recorded them at upload time — files uploaded
//! before that field existed show "—" instead of a made-up number
const formatSize = (bytes) => {
    if (bytes == null) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const DownloadItem = ({ moviePage, quality, size, url, seriesTitle, season, episode, maxQuality, canDownload }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    //! two separate reasons a row can be locked: the plan excludes downloads
    //! outright (Basic), or this particular file is above the plan's ceiling.
    //! The server enforces both again in downloadGuard — this only decides
    //! whether to offer the button
    const locked = !canDownload || !isQualityWithinPlan(quality, maxQuality);

    const handleDownload = async () => {
        setIsDownloading(true);

        try {

            if (!moviePage) {
                const response = await downloadEpisodeApi(url);

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                const formattedTitle = seriesTitle.replace(/\s+/g, '-');
                link.download = `${formattedTitle}-S${season}E${episode}-${quality}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else {
                const response = await downloadMovieApi(url);

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                const formattedTitle = seriesTitle.replace(/\s+/g, '-');
                link.download = `${formattedTitle}-${quality}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            className="bg-c-black-08 border border-c-black-15 rounded-lg mt-4 md:px-6 md:py-4 px-4 py-3 grid md:grid-cols-5 grid-cols-3 md:gap-10 gap-3"
        >
            <div className="md:col-span-2">
                <p className="text-c-grey-60 md:text-super-base text-super-xs mb-1">Quality</p>
                <p className="text-white tracking-wide md:text-super-sm text-xs">{quality}</p>
            </div>
            <div className="md:col-span-2">
                <p className="text-c-grey-60 md:text-super-base text-super-xs mb-1">Size</p>
                <p className="text-white tracking-wide md:text-super-sm text-xs">{formatSize(size)}</p>
            </div>
            <div className="flex items-center justify-end">
                {locked ? (
                    <span
                        className="border border-c-black-15 rounded-lg md:py-2 md:px-6 py-1 px-3
                            lg:text-base md:text-super-sm max-md:text-xs text-c-grey-60 flex items-center gap-2"
                        title={canDownload
                            ? `${quality} is above your plan's ${maxQuality} ceiling`
                            : "Downloads are not included in your plan"}
                    >
                        <LockIcon className="md:w-4 w-3.5 h-4" aria-hidden="true" />
                        Locked
                    </span>
                ) : (
                    <button
                        className="bg-c-black-10 hover:bg-c-black-12 border border-c-black-15 rounded-lg
                                    md:py-2 md:px-6 py-1 px-3 lg:text-base md:text-super-sm max-md:text-xs text-c-grey-70 flex items-center"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        Download <DownloadIcon className="md:w-5 w-3.5 ml-2" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default DownloadItem;