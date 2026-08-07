import Image from "next/image";

import HeaderCallToAction from "../singlePage/HeaderCallToAction";


const TopHeader = ({ id, kind, title, description, cover }) => {
    return (
        <div className="relative w-full xl:h-[80vh] md:h-[60vh] h-[50vh] overflow-hidden rounded-xl">
            {/*//! this cover is the largest thing on the page and almost always
                the LCP element, so it is fetched eagerly and served at the
                viewport's width rather than at whatever the upload happened to
                be. It was a raw <img> before: full resolution, every time. */}
            <Image
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${cover}`}
                alt={title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: "center 60%" }}
            />

            <div
                className="w-full absolute bottom-0 md:pb-10 pb-8 pt-20 text-center md:px-20 px-4
                bg-gradient-to-t from-c-black-08/90 via-c-black-08/60 via-65% to-transparent"
            >
                <h1 className="text-2.5xl text-white font-semibold">{title}</h1>
                <p
                    className="line-clamp-2 md:text-c-grey-60 text-c-grey-90 2xl:text-base xl:text-super-sm text-sm md:mt-3 mt-1 mb-5 md:block hidden"
                >
                    {!description || description === "" ? "No description available yet!" : description}
                </p>
                <HeaderCallToAction mediaId={id} kind={kind} />
            </div>

        </div>
    );
}

export default TopHeader;