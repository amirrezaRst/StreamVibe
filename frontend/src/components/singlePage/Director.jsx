import Image from "next/image";
import Link from "next/link";

const Director = ({ custom, director }) => {
    const { _id: id, fullName, birthPlace, profile } = director;
    return (
        <div>
            <p className={`text-c-grey-60 ${custom && "md:text-super-base"}`}>Director</p>
            <div className={`flex bg-c-black-08 border border-c-black-15 rounded-lg ${custom ? "p-3.5 mt-2.5" : "py-3 px-3 mt-2.5"}`}>
                <Link href={`/directors/${id}`}>
                    {/*//! a 600px upload drawn at 48 or 64 — sized down here
                        rather than shipped whole */}
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${profile}`}
                        alt={fullName}
                        width={64}
                        height={64}
                        sizes="64px"
                        className={`${custom ? "w-16 h-16" : "w-12 h-12"} object-cover object-center rounded-lg mr-3`}
                    />
                </Link>
                <div className="flex flex-col justify-around capitalize">
                    <Link href={`/directors/${id}`} >
                        <h5 className={`text-white ${!custom && "text-super-sm"} max-md:text-super-sm tracking-wide`}>{fullName}</h5>
                    </Link>
                    <span className={`block text-c-grey-60 ${custom ? "md:text-super-sm text-sm" : "text-sm"} `}>
                        From {birthPlace}
                    </span>
                </div>
            </div>
        </div>
    )
};

export default Director;