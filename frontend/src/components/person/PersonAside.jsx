import Image from "next/image";
import Link from "next/link";

import { CameraIcon, UserCircleIcon } from "@/assets/Svgs";

const Panel = ({ icon: Icon, title, children }) => (
    <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:p-6 md:p-5 p-4">
        <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-c-grey-60 mb-3.5">
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {title}
        </h2>
        {children}
    </div>
);

/**
 * Awards and collaborators.
 *
 * Awards used to be a hardcoded line reading "Academy Award for Best Original
 * Screenplay" on every person's page regardless of who they were; they now come
 * from the record, as chips so each one keeps its own shape and its year can
 * sit quiet beside the name.
 *
 * Collaborators are what turn three isolated pages into something browsable —
 * every name links to that person's own page.
 */
const PersonAside = ({ person, role, collaborators = [] }) => {
    const { awards } = person;

    //! read off the role rather than matched out of its label — a reworded
    //! heading should never be able to point these links at the wrong section
    const CollaboratorIcon = role.collaboratorKind === "director" ? CameraIcon : UserCircleIcon;
    const collaboratorSegment = role.collaboratorKind === "director" ? "directors" : "actors";

    return (
        <aside className="flex flex-col gap-4">
            <Panel icon={UserCircleIcon} title="Awards">
                {awards?.length ? (
                    <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                        {awards.map((award) => (
                            <li
                                key={`${award.name}-${award.year}`}
                                className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg
                                    bg-[#E8B663]/[0.09] border border-[#E8B663]/[0.26] text-[#E8B663]"
                            >
                                {award.name}
                                {award.year && <span className="text-[#E8B663]/60 tabular-nums">{award.year}</span>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-super-xs text-c-grey-60 italic m-0">No awards on record yet</p>
                )}
            </Panel>

            {collaborators.length > 0 && (
                <Panel icon={CollaboratorIcon} title={role.collaboratorLabel}>
                    <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                        {collaborators.map((person) => (
                            <li key={person._id}>
                                <Link
                                    href={`/${collaboratorSegment}/${person.slug || person._id}`}
                                    className="inline-flex items-center gap-2 text-xs py-1.5 ps-1.5 pe-3 rounded-lg capitalize
                                        bg-c-black-12 border border-c-black-20 text-c-grey-90
                                        hover:border-c-black-30 hover:text-white duration-150"
                                >
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${person.profile}`}
                                        alt=""
                                        width={40}
                                        height={40}
                                        sizes="20px"
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                    {person.fullName}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </aside>
    );
}

export default PersonAside;
