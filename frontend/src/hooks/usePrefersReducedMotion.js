"use client";

import { useEffect, useState } from "react";

/**
 * True once, on the client, if the visitor has asked their OS to cut down on
 * motion. Starts false so server and first client render agree — the
 * autoplay/pan effects it gates are progressive enhancement, not something
 * the initial paint depends on.
 */
const usePrefersReducedMotion = () => {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(query.matches);

        const onChange = (event) => setReduced(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    return reduced;
}

export default usePrefersReducedMotion;
