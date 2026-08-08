import { SearchSvg } from "@/assets/Svgs";
import { useState } from "react";
import SearchContainer from "./SearchContainer";


const SearchBox = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                aria-label="Search"
                className="py-2 focus:outline-none focus:border-none mx-2.5 md:inline hidden"
                onClick={() => setIsOpen(true)}
            >
                <SearchSvg className="3xl:w-[2.4rem] 3xl:h-[2.4rem]" aria-hidden="true" />
            </button>

            <SearchContainer isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
    );
}

export default SearchBox;