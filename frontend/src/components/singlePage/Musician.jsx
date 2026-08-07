import Image from "next/image";

const Musician = ({ custom, musician }) => (
    <div>
        <p className={`text-c-grey-60 ${custom && "md:text-super-base"}`}>Musician</p>
        <div
            className={`flex bg-c-black-08 border border-c-black-15 rounded-lg ${custom ? "p-3.5 mt-2.5" : "py-3 px-3 mt-2.5"}`}
        >
            {/* <Link href={`/musicians/${id}`} > */}
            <Image src="/images/musician.jpg"
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className={`${custom ? "w-16 h-16" : "w-12 h-12"} object-cover object-center rounded-lg mr-3`}
            />
            {/* </Link> */}
            <div className="flex flex-col justify-around capitalize">
                {/* <Link href={`/musicians/${id}`} > */}
                <h5 className={`text-white ${!custom && "text-super-sm"} max-md:text-super-sm tracking-wide`}>{musician.name}</h5>
                <span className={`block text-c-grey-60 ${custom ? "md:text-super-sm text-sm" : "text-sm"} `}>
                    From {musician.country}
                </span>
                {/* </Link> */}
            </div>
        </div>
    </div>
);

export default Musician;