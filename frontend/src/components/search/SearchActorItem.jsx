import Link from "next/link";
import { LeftArrowSvg } from "@/assets/Svgs";
import ActorItemProfile from "./ActoritemProfile";
import ActorItemInfo from "./ActorItemInfo";

const SearchActorItem = ({ type, data, handleClose }) => {
    const { _id, slug, fullName, profile, country, birthDate, birthPlace, bio } = data;
    const id = slug || _id;

    return (
        <div className="w-full px-5 py-4 flex  gap-6 bg-c-black-10/65 backdrop-blur-sm border-2 border-c-black-15 rounded-xl">
            <ActorItemProfile profile={profile} />
            <div className="flex flex-col justify-between items-start tracking-wide">
                <ActorItemInfo
                    type={type}
                    id={id}
                    fullName={fullName}
                    birthDate={birthDate}
                    birthPlace={birthPlace}
                    country={country}
                    bio={bio}
                    handleClose={handleClose}
                />
                <Link href={`/${type === "director" ? "directors" : "actors"}/${id}`}>
                    <span
                        className="text-white font-medium text-super-sm flex items-center gap-2.5"
                        onClick={handleClose}
                    >
                        View More <LeftArrowSvg className="stroke-white rotate-180 w-4 h-4" />
                    </span>
                </Link>

            </div>
        </div>
    );
}

export default SearchActorItem;