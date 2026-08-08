import Image from "next/image";

//! The identity column, shared by every catalogue table: a thumbnail small
//! enough not to dominate a dense row, the title, and one line of whatever
//! tells them apart.
const MediaCell = ({ image, title, subtitle, rounded }) => (
    <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-[30px] h-[34px] shrink-0 overflow-hidden bg-c-black-12
            ${rounded ? "rounded-full h-[30px]" : "rounded"}`}>
            {image && (
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${image}`}
                    alt=""
                    width={60} height={68}
                    className="w-full h-full object-cover"
                />
            )}
        </div>
        <div className="min-w-0">
            <p className="text-c-grey-90 font-bold truncate capitalize">{title}</p>
            {subtitle && <p className="text-[10.5px] text-c-grey-55 truncate">{subtitle}</p>}
        </div>
    </div>
);

export default MediaCell;
