import { DownloadIcon, WatchSvg } from "@/assets/Svgs";
import Link from "next/link";

const EpisodeItemInfo = ({ title, seriesId, seasonNumber, episodeNumber, description, runtime }) => {
    return (
        <div className="flex-1 flex flex-col justify-between py-2">
            <div className="flex xl:flex-row flex-col lg:items-start max-xl:gap-3 max-md:gap-1.5 max-xl:mb-2 max-md:mb-0 justify-between">
                <h4 className="text-white max-md:text-sm line-clamp-2">{title}</h4>
                <div className="flex lg:flex-col items-end max-lg:justify-end gap-2.5">
                    <span
                        className="bg-c-black-08 border border-c-black-15 rounded-md text-c-grey-60
                md:py-1.5 py-1 md:px-3.5 px-2.5 lg:text-super-sm  text-super-xs flex items-center gap-1"
                    >
                        <WatchSvg className="lg:w-[20px] lg:h-[20px] w-[16px] h-[16px]" /> {runtime} min
                    </span>
                    {/*//! same fix as the thumbnail beside it — one control, a
                        link, carrying its own name rather than a nameless
                        button nested inside a nameless link */}
                    <Link
                        href={`/series/${seriesId}/${seasonNumber}/${episodeNumber}`}
                        aria-label={`Open episode ${episodeNumber}: ${title}`}
                        className="rounded-full flex items-center justify-center bg-c-black-08
                            border border-c-black-15 p-2"
                    >
                        <DownloadIcon className="w-5 h-5" aria-hidden="true" />
                    </Link>
                </div>
            </div>
            <p className="text-c-grey-60 lg:text-sm text-super-xs max-md:hidden lg:line-clamp-3 line-clamp-2">
                {!description || description === "" ? "No description available yet!" : description}
            </p>
        </div>
    );
}

export default EpisodeItemInfo;