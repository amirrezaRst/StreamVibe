import { DownloadIcon } from "@/assets/Svgs";
import DownloadItem from "./DownloadItem";

const DownloadSection = ({ files, seriesTitle, moviePage, season, episode }) => {
    return (
        <section
            className="bg-c-black-10 border border-c-black-15 xl:p-9 md:px-5 md:py-5 px-3.5 py-3.5 rounded-2.5xl"
        >
            <h4
                className="text-white md:text-xl text-base font-medium lg:mb-8 md:mb-5 mb-6"
            >
                Download Links
            </h4>

            {files.length > 0 ? files.map((file, index) => (
                <DownloadItem key={index} moviePage quality={file.quality} size={'1.2 GB'} url={file.url} seriesTitle={seriesTitle} season={season} episode={episode} />
            )) : (
                <div className="flex flex-col items-center text-center py-10">
                    <div className="w-11 h-11 rounded-full bg-c-black-12 border border-c-black-15 flex items-center justify-center mb-3.5">
                        <DownloadIcon className="w-5 h-5 text-c-grey-60" aria-hidden="true" />
                    </div>
                    <p className="text-c-grey-90 font-semibold text-sm mb-1">No download links yet</p>
                    <p className="text-c-grey-60 text-[13px] max-w-xs">
                        {moviePage
                            ? "This movie isn't available for download on StreamVibe yet."
                            : "This episode isn't available for download on StreamVibe yet."}
                    </p>
                </div>
            )}

        </section>
    );
}

export default DownloadSection;