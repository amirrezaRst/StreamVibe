import { RightArrowSvg } from "@/assets/Svgs";
import Image from "next/image";
import Link from "next/link";


const MultipleCard = ({ title, images, baseurl, topRated }) => {
    const placeholders = 4 - images?.length;
    const displayImages = images?.slice(0, 4);

    return (
        <Link href={`${baseurl}/${title}${topRated ? "?topRated=true" : ""}`} className="flex-shrink-0 3xl:w-72 md:w-60 w-44">
            <div className="lg:px-5 md:px-4 md:py-4 p-3 bg-c-black-10 border border-c-black-15 rounded-xl relative  duration-300 cursor-pointer">

                <div className="mb-9">
                    <div className="grid grid-cols-2 gap-1">
                        {displayImages?.map((src, index) => (
                            // <img key={index} src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${src}`} alt={src}
                            //     className="w-full rounded-xl aspect-square object-cover object-top" />
                            <Image
                                key={index}
                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${src}`}
                                //! decorative: these four thumbnails illustrate
                                //! the genre named in the heading beside them,
                                //! and the alt was the upload filename
                                alt=""
                                width={288}
                                height={432}
                                className="w-full rounded-xl aspect-square object-cover object-top"
                                quality={55}
                            />
                        ))}
                        {Array.from({ length: placeholders })?.map((_, index) => (
                            <div key={index + displayImages.length} className="w-full bg-c-black-20 rounded-xl aspect-square"></div>
                        ))}
                    </div>
                </div>
                <div
                    className="w-full h-[100%] bg-gradient-to-t from-c-black-10 via-c-black-10/55 via-65% to-c-black-2/20 rounded-b-xl
                 absolute bottom-0 left-0 flex items-end px-5 py-4"
                >
                    <div className="flex-1 flex items-center justify-between mt-4">
                        <h4 className="font-medium text-white capitalize">{title}</h4>
                        {/*//! was a <button> inside the card's <Link> — invalid
                            nesting, and a tab stop that did nothing when it was
                            reached. The whole card is the control; this arrow
                            only points at it */}
                        <span aria-hidden="true"><RightArrowSvg /></span>
                    </div>
                </div>

            </div>
        </Link>
    );
}

export default MultipleCard;