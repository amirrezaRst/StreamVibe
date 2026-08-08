import { ClockIcon, EpisodeIcon, EyeIcon, PlaySvg } from "@/assets/Svgs";
import Link from "next/link";
import StarRating from "./common/StarRating";
import Image from "next/image";

//! `id` may be a slug or an _id — the detail routes resolve either, so callers
//! pass whichever they have and readable URLs win wherever the slug is loaded
const MovieCard = ({ id, special, series, image, title, view, duration, episodes, rate }) => {
    return (
        <div
            className={`bg-c-black-10 border border-c-black-15 rounded-xl flex-shrink-0 flex flex-col justify-between
                 ${special ? "max-md:w-full px-4 py-4" : "3xl:w-72 xl:w-60 md:w-52 w-44 px-2.5 py-2.5"} md:px-4 md:py-4 `}
        >
            <div>
                <Link href={series ? `/series/${id}` : `/movies/${id}`}>
                    <Image
                        width={288}
                        height={432}
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${image}`}
                        alt={title}
                        className="rounded-xl w-full aspect-thumbnail object-cover object-top"
                    />
                </Link>
                <Link href={series ? `/series/${id}` : `/movies/${id}`}>
                    <h3
                        className={`mt-3 3xl:mb-4 mb-2 3xl:leading-7 3xl:text-1.5xl text-base ${special && "max-md:text-xl max-md:font-medium"} text-white tracking-wide line-clamp-2 capitalize`}
                    >{title}</h3>
                </Link>
                <div className={`flex justify-between max-md:flex-col text-c-grey-60 3xl:text-super-base ${special ? "md:text-sm text-super-base" : "text-sm"}`}>
                    {series ?
                        <div className="flex items-center gap-0.5 md:bg-c-black-08 md:border border-c-black-15 rounded-full 3xl:py-1.5 py-0.5 3xl:px-3.5 px-[.38rem]">
                            <EpisodeIcon className="w-[1.15rem] h-[1.15rem]" /> {episodes}
                        </div> :
                        <div className="flex items-center gap-0.5 md:bg-c-black-08 md:border border-c-black-15 rounded-full 3xl:py-1.5 py-0.5 3xl:px-3.5 px-[.38rem]">
                            <ClockIcon className="w-[1.15rem] h-[1.15rem]" /> {duration}
                        </div>
                    }
                    <div className="flex items-center gap-0.5 md:bg-c-black-08 md:border border-c-black-15 rounded-full 3xl:py-1.5 py-0.5 3xl:px-3.5 px-[.38rem]">
                        <EyeIcon className="w-5 h-5" /> {view}
                    </div>
                </div>
                <div className="flex justify-between gap-1 text-c-grey-60 3xl:text-super-base text-super-xs text-center mt-2">
                    <div className={`bg-c-black-08 border border-c-black-15 rounded-full 3xl:py-1.5 ${special ? "py-1" : "py-0.5"} 3xl:px-4 px-2`}>
                        <StarRating special={special} rating={rate} />
                    </div>
                </div>
            </div>
            <Link href={series ? `/series/${id}` : `/movies/${id}`}>
                <button className="bg-c-red-45 w-full text-white 3xl:text-base md:text-super-xs text-sm font-medium rounded-lg py-1.5 mt-4">
                    Play Now <PlaySvg className="inline w-6 h-6" />
                </button>
            </Link>
        </div >
    );
}

export default MovieCard;