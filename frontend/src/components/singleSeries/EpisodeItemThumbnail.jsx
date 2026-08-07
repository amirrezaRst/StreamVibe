import Image from "next/image";
import Link from "next/link";

import { CirclePlayIcon } from "@/assets/Svgs";

const EpisodeItemThumbnail = ({ seriesId, seriesTitle, seasonNumber, episodeNumber, thumbnail }) => {
    return (
        <div className="relative rounded-2xl overflow-hidden lg:w-52 lg:h-28 md:w-56 md:h-32 h-36 border border-c-black-15">
            {/*//! episode stills are uploaded at whatever the source was — one
                of them is a 306 kB PNG — and drawn in a 208px box. A season
                page shows ten of them at once. */}
            <Image
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${thumbnail}`}
                alt={`${seriesTitle} season ${seasonNumber}, episode ${episodeNumber}`}
                fill
                sizes="(min-width: 1024px) 208px, (min-width: 768px) 224px, 100vw"
                className="object-cover object-center"
            />
            {/*//! the play control is the link — it used to wrap a <button>,
                which nested one interactive element inside another and left
                both without a name */}
            <Link
                href={`/series/${seriesId}/${seasonNumber}/${episodeNumber}`}
                aria-label={`Play ${seriesTitle} season ${seasonNumber}, episode ${episodeNumber}`}
                className="lg:w-[3.1rem] lg:h-[3.1rem] w-[3.4rem] h-[3.4rem] rounded-full flex justify-center items-center
bg-black/60 hover:bg-black/80 transition-all absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            >
                <CirclePlayIcon className="lg:w-[27px] lg:h-[27px] w-[26px] h-[26px] stroke-white" aria-hidden="true" />
            </Link>
        </div>
    );
}

export default EpisodeItemThumbnail;