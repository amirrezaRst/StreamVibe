import Image from "next/image";
import Link from "next/link";

import { GlobalOutlineIcon, MemoriamIcon } from "@/assets/Svgs";

//! a life span ("1938–2016") replaces the birth year for someone who has
//! died — it says more in the same space, and reads correctly without a
//! "b."/"d." prefix either way
const yearLine = (person) => {
    if (!person.birthDate) return null;
    if (person.death_date) return `${person.birthDate}–${new Date(person.death_date).getFullYear()}`;
    return person.birthDate;
};

const PersonCard = ({ person, segment }) => {
    const deceased = !!person.death_date;

    return (
        <Link
            href={`/${segment}/${person.slug || person._id}`}
            className="group block outline-none"
        >
            <div
                className={`relative aspect-square rounded-2xl overflow-hidden bg-c-black-10 border duration-200
                    ${deceased
                        ? "border-c-black-15 group-hover:border-[#E8B663] group-focus-visible:border-[#E8B663]"
                        : "border-c-black-15 group-hover:border-c-red-45 group-focus-visible:border-c-red-45"}
                    group-hover:-translate-y-[3px] group-focus-visible:-translate-y-[3px]
                    group-hover:shadow-[0_14px_28px_-14px_rgba(0,0,0,0.65)] group-focus-visible:shadow-[0_14px_28px_-14px_rgba(0,0,0,0.65)]
                    group-focus-visible:ring-2 group-focus-visible:ring-c-red-45/40`}
            >
                {deceased && (
                    <span className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded-md border
                        border-[#E8B663]/35 bg-black/55 backdrop-blur-sm px-1.5 py-1 text-[8.5px] font-extrabold
                        uppercase tracking-[0.1em] text-[#E8B663]">
                        <MemoriamIcon className="w-2 h-2" aria-hidden="true" />
                        In Memoriam
                    </span>
                )}
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${person.profile}`}
                    alt=""
                    fill
                    sizes="(min-width: 1300px) 14vw, (min-width: 1040px) 16vw, (min-width: 780px) 22vw, (min-width: 560px) 30vw, 45vw"
                    loading="lazy"
                    className={`object-cover duration-[400ms] group-hover:scale-[1.06] ${deceased ? "grayscale contrast-[1.02]" : ""}`}
                />
            </div>

            <h3 className={`mt-2.5 text-[13px] font-bold text-c-grey-97 leading-tight truncate capitalize border-b-[1.5px] duration-200
                ${deceased ? "border-transparent group-hover:border-[#E8B663]/60" : "border-transparent group-hover:border-c-red-45/50"}`}>
                {person.fullName}
            </h3>

            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-c-grey-60">
                <GlobalOutlineIcon className="w-[11px] h-[11px] shrink-0 opacity-75" aria-hidden="true" />
                <span className="truncate">{person.country}</span>
                {yearLine(person) && <>
                    <span className="opacity-60" aria-hidden="true">·</span>
                    <span className="shrink-0">{yearLine(person)}</span>
                </>}
            </p>
        </Link>
    );
}

export default PersonCard;
