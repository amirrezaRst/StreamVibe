import { LikeOutlineIcon, PlaySvg, PlusSvg, SoundSvg } from "@/assets/Svgs";

//! icon-only, so the accessible name has to be written out — the icon itself
//! carries none, and "button, button, button" is what a screen reader reads
//! from a row like this otherwise
const ICON_ACTIONS = [
    { label: "Add to watchlist", Icon: PlusSvg },
    { label: "Like", Icon: LikeOutlineIcon },
    { label: "Mute", Icon: SoundSvg },
];

const CarouselCallToAction = () => {
    return (
        <div className="flex md:flex-row flex-col items-center justify-center md:gap-3.5 gap-2">
            <button
                type="button"
                className="bg-c-red-45 text-white md:text-super-sm text-super-xs font-medium xl:h-10 md:h-11 h-9 px-5 flex items-center md:gap-1.5 gap-1 rounded-md border-0
                 outline-none max-md:mt-3"
            >
                <PlaySvg className="md:w-[27px] w-5" aria-hidden="true" /> Play Now
            </button>
            <div className="flex items-center gap-2.5">
                {ICON_ACTIONS.map(({ label, Icon }) => (
                    <button
                        key={label}
                        type="button"
                        aria-label={label}
                        className="xl:h-11 md:h-11 h-9 xl:w-11 md:w-11 w-9 md:p-2.5 p-2 bg-c-black-06 border border-c-black-15 rounded-md flex items-center justify-center"
                    >
                        <Icon aria-hidden="true" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CarouselCallToAction;