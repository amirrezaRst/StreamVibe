import Image from "next/image";
import Link from "next/link";

import { StarIcon } from "@/assets/Svgs";

const year = (value) => (value ? String(value).slice(0, 4) : null);

/**
 * The three credits worth leading with. Ranked by rating, because that is a
 * genuine ordering rather than a decorative one — and falling back to views
 * when nothing is rated yet, which on this catalogue is most of it.
 */
const KnownFor = ({ credits }) => {
    const ranked = [...credits]
        .sort((a, b) => (b.rate || 0) - (a.rate || 0) || (b.views || 0) - (a.views || 0))
        .slice(0, 3);

    if (!ranked.length) return null;

    return (
        <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:p-6 md:p-5 p-4">
            <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-c-grey-60 mb-4">
                <StarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Known for
            </h2>

            <ul className="flex flex-col gap-3 list-none m-0 p-0">
                {ranked.map((credit) => (
                    <li key={credit._id}>
                        <Link
                            href={`/${credit.totalEpisodes !== undefined ? "series" : "movies"}/${credit.slug || credit._id}`}
                            className="grid grid-cols-[46px_1fr_auto] items-center gap-3.5 group"
                        >
                            <Image
                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${credit.thumbnail}`}
                                alt=""
                                width={92}
                                height={138}
                                sizes="46px"
                                className="w-[46px] h-[69px] object-cover rounded-md border border-c-black-20"
                            />

                            <span className="min-w-0">
                                <span className="block text-super-sm font-bold text-c-grey-97 truncate capitalize
                                    group-hover:text-white duration-150">
                                    {credit.title}
                                </span>
                                <span className="block text-super-xs text-c-grey-60 truncate capitalize">
                                    {[year(credit.release_date), credit.genres?.slice(0, 2).join(", ")]
                                        .filter(Boolean).join(" · ")}
                                </span>
                            </span>

                            {credit.rate > 0 && (
                                <span className="flex items-center gap-1.5 text-super-xs text-c-grey-60 tabular-nums">
                                    <StarIcon className="w-3.5 h-3.5 text-c-red-45" aria-hidden="true" />
                                    {credit.rate.toFixed(1)}
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default KnownFor;
