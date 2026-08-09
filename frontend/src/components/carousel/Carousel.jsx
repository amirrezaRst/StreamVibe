"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import CarouselCallToAction from "./CarouselCallToAction";
import CarouselInfo from "./CarouselInfo";
import CarouselPagination from "./CarouselPagination";

const DWELL_MS = 7000;

/**
 * The /explore hero. Used to be one hardcoded image of a film not even in
 * the catalogue, with a play button that went nowhere and four dots that
 * never moved — `slides` now comes from the admin-managed spotlight list,
 * and every control on it does what it says.
 *
 * Two layers, updated independently: the backdrops are stacked one per
 * slide and cross-faded, each getting its own slow Ken Burns drift while
 * showing; the title/synopsis/buttons are a single block that re-keys off
 * `activeIndex`, the same way the pagination dots do. Splitting it this way
 * — rather than one full copy of the content per slide — is what keeps the
 * dots from ending up stacked underneath the buttons instead of below them.
 */
const Carousel = ({ slides = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const timerRef = useRef(null);

    const count = slides.length;

    const goTo = useCallback((index) => {
        setActiveIndex(((index % count) + count) % count);
    }, [count]);

    const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
    const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

    //! a visitor who has asked the OS to cut down on motion does not get an
    //! auto-advancing hero either — the same reasoning that hides the pan
    useEffect(() => {
        if (count < 2 || paused || reducedMotion) return;

        timerRef.current = setInterval(() => {
            setActiveIndex((current) => (current + 1) % count);
        }, DWELL_MS);

        return () => clearInterval(timerRef.current);
    }, [count, paused, reducedMotion]);

    if (count === 0) return null;

    const active = slides[activeIndex];

    return (
        <header
            className="w-full xl:h-[80vh] md:h-[65vh] h-[450px] rounded-xl overflow-hidden flex items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
                //! only resume once focus has actually left the whole carousel,
                //! not just moved from one of its buttons to the next
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
            }}
        >
            <div className="rounded-2xl relative w-full h-full overflow-hidden flex-shrink-0">
                {/*//! Backdrops — stacked, cross-faded, each panning while active */}
                {slides.map((slide, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <div
                            key={slide._id}
                            aria-hidden="true"
                            className="absolute inset-0 transition-opacity ease-in-out"
                            style={{
                                opacity: isActive ? 1 : 0,
                                zIndex: isActive ? 1 : 0,
                                transitionDuration: reducedMotion ? "0ms" : "1000ms",
                            }}
                        >
                            <div
                                className="absolute inset-0"
                                style={{
                                    transform: isActive && !reducedMotion ? "scale(1.08)" : "scale(1)",
                                    transition: isActive && !reducedMotion ? `transform ${DWELL_MS + 1000}ms linear` : "none",
                                }}
                            >
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${slide.media.cover || slide.media.thumbnail}`}
                                    alt=""
                                    fill
                                    priority={index === 0}
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    );
                })}

                {/*//! Overlay Effect — z-index matters here: the active backdrop
                    above carries an explicit z-index of 1, which stacks above
                    any sibling left at the implicit "auto" regardless of DOM
                    order, so both this and the content block need their own
                    explicit value higher than the backdrops' to actually sit
                    on top of them rather than under them */}
                <div className="w-full md:h-[60%] h-[80%] bg-gradient-to-t from-c-black-08 via-c-black-08/70 via-55% to-c-black-08/0 absolute bottom-0 z-[2]" />

                {/*//! Movie Info And Call To Actions — one instance, re-keyed per
                    slide so the rise-in animation restarts on every change */}
                <div className="w-full flex flex-col items-center text-center absolute bottom-0 pb-7 z-[2]">
                    <div key={active._id}>
                        <CarouselInfo title={active.media.title} description={active.media.description} />
                        <CarouselCallToAction
                            id={active.media.slug || active.media._id}
                            kind={active.kind}
                            mediaId={active.media._id}
                        />
                    </div>

                    <CarouselPagination total={count} activeIndex={activeIndex} onNext={next} onPrev={prev} onSelect={goTo} />
                </div>
            </div>
        </header>
    );
}

export default Carousel;
