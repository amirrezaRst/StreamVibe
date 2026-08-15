const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

//! shared by both failure pages so the one that is a link and the one that is
//! a button still look like the same control
export const ERROR_ACTION_PRIMARY =
    "inline-flex items-center gap-2.5 rounded-lg md:py-3 py-2.5 md:px-6 px-4 md:text-super-sm text-xs " +
    "font-semibold bg-c-red-45 hover:bg-c-red-55 text-white duration-200 " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const ERROR_ACTION_GHOST =
    "inline-flex items-center gap-2.5 rounded-lg md:py-3 py-2.5 md:px-6 px-4 md:text-super-sm text-xs " +
    "font-semibold bg-c-black-10 hover:bg-c-black-12 border border-c-black-15 text-c-grey-70 duration-200 " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * The card both failure pages are built from: a length of film running across
 * a dark stage, real posters in the frames, and the frame in the middle wrong.
 *
 * The two states say different things on purpose. `empty` is a gap in the reel
 * — the shot was never there, which is what a 404 means. `burn` is film that
 * stalled in the projector gate until the heat ate through it — something
 * existed and it failed, which is what a 500 means. Sharing one component
 * keeps them recognisably the same reel failing in two different ways.
 *
 * Every prop is optional bar the code: this renders on the pages that run when
 * something has already gone wrong, so it has to survive being handed nothing.
 */

//! Plain <img> rather than next/image, and this is the one place in the app
//! that is right. next/image proxies through the app's own optimiser, which on
//! the 500 page may well be the thing that is broken — going straight to the
//! image host means a decorative poster can fail without taking anything with
//! it. They are decorative, so they carry no alt text either way.
const Frame = ({ poster, dim, edge }) => (
    <div
        className={`w-[92px] md:w-[118px] aspect-[4/4.5] rounded-[3px] overflow-hidden bg-c-black-12
            shrink-0 relative ${edge ? "hidden md:block" : ""}`}
    >
        {poster && (
            <img
                src={`${IMAGE_URL}/${poster}`}
                alt=""
                aria-hidden="true"
                className={`w-full h-full object-cover ${dim ? "opacity-20" : "opacity-[0.42]"}`}
            />
        )}
    </div>
);

const BurnFilter = () => (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
            {/*//! the ragged edge: a smooth ellipse displaced by fractal noise.
                A perfect oval reads as a hole punched in the film, not burned */}
            <filter id="sv-burn-edge" x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="11" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/*//! a real gate burn is a black hole, one thin incandescent line
                where the emulsion is actually alight, then a wide brown char
                fading out. An even saturated band across the whole rim reads
                as a glowing portal instead */}
            <radialGradient id="sv-burn-grad">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="54%" stopColor="#000000" />
                <stop offset="61%" stopColor="#150400" />
                <stop offset="67%" stopColor="#8f1400" />
                <stop offset="71%" stopColor="#FF4A16" />
                <stop offset="75%" stopColor="#9c2a06" />
                <stop offset="82%" stopColor="#41180b" stopOpacity="0.95" />
                <stop offset="91%" stopColor="#20100a" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
        </defs>
    </svg>
);

const WrongFrame = ({ code, variant, burnPoster }) => (
    <div
        className={`w-[92px] md:w-[118px] aspect-[4/4.5] rounded-[3px] overflow-hidden shrink-0 relative
            ${variant === "burn"
                ? "bg-[#050506]"
                : "bg-[#050506] border border-dashed border-white/[0.17] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]"}`}
    >
        {variant === "burn" && (
            <>
                {burnPoster && (
                    <img
                        src={`${IMAGE_URL}/${burnPoster}`}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover opacity-30"
                    />
                )}
                <div className="absolute -inset-[18%]" aria-hidden="true">
                    <svg viewBox="0 0 100 112" preserveAspectRatio="none" className="w-full h-full block">
                        <ellipse cx="50" cy="56" rx="31" ry="35" fill="url(#sv-burn-grad)" filter="url(#sv-burn-edge)" />
                    </svg>
                </div>
            </>
        )}

        <span
            className="absolute inset-0 grid place-items-center md:text-[34px] text-[27px] font-extrabold
                tracking-[-0.04em] text-c-grey-97 tabular-nums drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
        >
            {code}
        </span>
    </div>
);

const FilmStripStage = ({
    code,
    variant = "empty",
    title,
    description,
    posters = [],
    burnPoster,
    children,
}) => (
    <main className="container xl:py-14 md:py-10 py-6">
        {variant === "burn" && <BurnFilter />}

        <div
            className="relative border border-c-black-15 rounded-2.5xl overflow-hidden isolate
                md:min-h-[600px] min-h-[455px] grid place-items-center animate-gate-flicker
                bg-[radial-gradient(120%_90%_at_50%_42%,#16181c_0%,#0d0e10_52%,#08090a_100%)]"
        >
            {/*//! decoration, all of it — announced to nobody */}
            <div className="absolute inset-x-0 top-[11px] h-[26px] z-[2] film-perforations" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-[11px] h-[26px] z-[2] film-perforations" aria-hidden="true" />
            <div className="absolute -inset-1/2 z-[4] pointer-events-none film-grain" aria-hidden="true" />
            <div className="absolute inset-0 z-[3] pointer-events-none film-scanlines" aria-hidden="true" />

            <div className="relative z-[5] w-full md:px-[30px] px-[18px] md:py-[6%] py-[8%] flex flex-col items-center text-center">

                {/*//! the strip runs wider than the card and is faded off at both
                    ends, so it reads as a continuing reel rather than a graphic
                    that happens to be sitting in a box */}
                <div className="w-[calc(100%+60px)] md:w-[calc(100%+120px)] -mx-[30px] md:-mx-[60px] film-strip-mask">
                    <div className="bg-[#0a0b0c] border-y border-white/[0.09] py-[22px] relative">
                        <div className="absolute inset-x-0 top-[6px] h-[11px] film-strip-perforations" aria-hidden="true" />
                        <div className="absolute inset-x-0 bottom-[6px] h-[11px] film-strip-perforations" aria-hidden="true" />

                        <div className="flex gap-2 justify-center px-2">
                            <Frame poster={posters[0]} dim edge />
                            <Frame poster={posters[1]} />
                            <WrongFrame code={code} variant={variant} burnPoster={burnPoster} />
                            <Frame poster={posters[2]} />
                            <Frame poster={posters[3]} dim edge />
                        </div>
                    </div>
                </div>

                <h1 className="md:mt-8 mt-[26px] mb-3 text-c-grey-97 font-extrabold leading-[1.1]
                    tracking-[-0.03em] lg:text-4xl md:text-3xl text-2xl">
                    {title}
                </h1>

                <p className="text-c-grey-60 mx-auto md:mb-6 mb-[18px] max-w-[52ch] md:text-base text-super-xs">
                    {description}
                </p>

                <div className="flex gap-2.5 justify-center flex-wrap">
                    {children}
                </div>
            </div>
        </div>
    </main>
);

export default FilmStripStage;
