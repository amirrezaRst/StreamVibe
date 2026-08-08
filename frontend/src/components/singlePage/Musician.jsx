import Image from "next/image";
import Link from "next/link";

/**
 * The composer credited on this title.
 *
 * This block used to print a literal "Kyle Dixon — From USA" with one fixed
 * photo on every film and series in the catalogue, ignoring the prop it was
 * handed. It now reads the record, and a title with no composer on file renders
 * nothing at all rather than attributing someone else's work.
 */
const Musician = ({ custom, musician }) => {
    if (!musician?.fullName) return null;

    const address = musician.slug || musician._id;

    return (
        <div>
            <p className={`text-c-grey-60 ${custom && "md:text-super-base"}`}>Musician</p>
            <div className={`flex bg-c-black-08 border border-c-black-15 rounded-lg ${custom ? "p-3.5 mt-2.5" : "py-3 px-3 mt-2.5"}`}>
                <Link href={`/musicians/${address}`} aria-label={musician.fullName}>
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${musician.profile}`}
                        alt=""
                        width={64}
                        height={64}
                        sizes="64px"
                        className={`${custom ? "w-16 h-16" : "w-12 h-12"} object-cover object-center rounded-lg mr-3`}
                    />
                </Link>
                <div className="flex flex-col justify-around capitalize">
                    <Link href={`/musicians/${address}`}>
                        <h5 className={`text-white ${!custom && "text-super-sm"} max-md:text-super-sm tracking-wide`}>
                            {musician.fullName}
                        </h5>
                    </Link>
                    {(musician.birthPlace || musician.country) && (
                        <span className={`block text-c-grey-60 ${custom ? "md:text-super-sm text-sm" : "text-sm"}`}>
                            From {musician.birthPlace || musician.country}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Musician;
