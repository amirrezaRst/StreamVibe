"use client";

import { useEffect, useRef, useState } from "react";

const SCROLLED_AT = 8;
const HIDE_AFTER = 96;

/**
 * Drives the navbar's scroll-reactive chrome. `scrolled` flips past a small
 * threshold (background/blur turns on); `hidden` only turns true once the
 * visitor has scrolled down past HIDE_AFTER, so the bar never disappears
 * while they're still reading the top of the page, and reappears the moment
 * they scroll back up.
 */
const useScrollDirection = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        lastY.current = window.scrollY;

        const update = () => {
            const y = window.scrollY;
            setScrolled(y > SCROLLED_AT);
            setHidden(y < HIDE_AFTER ? false : y > lastY.current);
            lastY.current = y;
            ticking.current = false;
        };

        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(update);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return { scrolled, hidden };
};

export default useScrollDirection;
