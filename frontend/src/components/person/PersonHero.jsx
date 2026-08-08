import Image from "next/image";

import { CalendarIcon, GlobalOutlineIcon } from "@/assets/Svgs";

/**
 * The portrait sits on a backdrop tinted from the person's own poster art, the
 * same treatment the film detail hero uses — it ties a person to their work
 * instead of floating a square photo on flat grey.
 *
 * The backdrop is the first credit's poster, blurred hard and dimmed. When
 * somebody has no credits there is nothing to tint with, so it falls back to a
 * plain panel rather than an empty smear.
 */
const PersonHero = ({ person, role, backdrop }) => {
    const { fullName, birthDate, birthPlace, country, profile, death_date } = person;
    const RoleIcon = role.Icon;

    //! most birthplaces are already "City, Country" — appending the country
    //! again to those produced "Frankfurt, Germany, Germany"
    const place = birthPlace
        ? (country && !birthPlace.toLowerCase().includes(country.toLowerCase())
            ? `${birthPlace}, ${country}`
            : birthPlace)
        : country;

    return (
        <section className="relative overflow-hidden rounded-2.5xl border border-c-black-15 bg-c-black-10">
            {backdrop && (
                <div className="absolute inset-0" aria-hidden="true">
                    <Image
                        src={backdrop}
                        alt=""
                        fill
                        sizes="100vw"
                        priority
                        className="object-cover scale-110 blur-2xl brightness-[0.45]"
                    />
                </div>
            )}
            {/*//! without this the name would sit on whatever colour the poster
                happened to be, which is unreadable about half the time */}
            <div className="absolute inset-0 bg-gradient-to-t from-c-black-10 via-c-black-10/85 to-c-black-10/60" aria-hidden="true" />

            <div className="relative flex md:flex-row flex-col md:items-end items-start gap-6 xl:p-9 md:p-7 p-5">
                <div className="xl:w-[168px] md:w-[136px] w-[104px] shrink-0 aspect-square rounded-2xl overflow-hidden
                    border-2 border-white/[0.08] shadow-[0_22px_50px_-18px_rgba(0,0,0,0.92)]">
                    <Image
                        src={profile}
                        alt={fullName}
                        width={336}
                        height={336}
                        sizes="(min-width: 1280px) 168px, (min-width: 768px) 136px, 104px"
                        className={`w-full h-full object-cover ${death_date ? "grayscale" : ""}`}
                    />
                </div>

                <div className="min-w-0">
                    {/*//! the role reads as a credit line rather than a coloured
                        pill — the same letterspaced-caps-over-a-rule vocabulary
                        the film sidebar uses for its own labels */}
                    <span className="inline-flex items-center gap-2 pb-2 mb-3 border-b border-c-red-45/50
                        text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-c-grey-70">
                        <RoleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {role.label}
                    </span>

                    <h1 className="text-white 3xl:text-[2.6rem] xl:text-4xl md:text-3xl text-2xl font-extrabold
                        tracking-[-0.03em] leading-[1.05] mb-3 capitalize">
                        {fullName}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-c-grey-65 md:text-sm text-super-xs">
                        {birthDate && (
                            <span className="inline-flex items-center gap-2">
                                <CalendarIcon className="w-[15px] h-[15px] shrink-0" aria-hidden="true" />
                                Born <b className="text-c-grey-90 font-semibold">{birthDate}</b>
                            </span>
                        )}
                        {place && (
                            <span className="inline-flex items-center gap-2 capitalize">
                                <GlobalOutlineIcon className="w-[15px] h-[15px] shrink-0" aria-hidden="true" />
                                {place}
                            </span>
                        )}
                        {death_date && (
                            <span className="text-c-grey-60">
                                Died {new Date(death_date).getFullYear()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default PersonHero;
