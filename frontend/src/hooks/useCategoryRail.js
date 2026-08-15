"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The genre rail's data, shared by the home page and the two explore rails,
 * because all three were carrying their own copy of it — and therefore their
 * own copy of the same bug.
 *
 * Each rendered `loading || categories.length === 0 ? <skeletons/>`. Both
 * category services swallow their errors and hand back `[]`, so a failed
 * request set loading false and left an empty array behind: the condition
 * stayed true and the rail shimmered forever, with nothing ever arriving. A
 * skeleton is a promise that content is coming, and that promise has to be
 * withdrawn when it isn't.
 *
 * So failure is a state of its own here rather than something indistinguishable
 * from loading, and it comes with a way out.
 *
 * @param fetcher a category service — resolves to an object keyed by genre on
 *   success, or [] on failure. Must be stable across renders (a module-level
 *   import is), since it drives the effect.
 */
export const useCategoryRail = (fetcher) => {
    const [entries, setEntries] = useState([]);
    const [status, setStatus] = useState("loading");

    //! isActive lets the initial load bail out if the component unmounted while
    //! the request was in flight; the retry path passes nothing and always
    //! commits, since the user is by definition still looking at it
    const load = useCallback(async (isActive) => {
        setStatus("loading");

        const data = await fetcher();
        if (isActive && !isActive()) return;

        //! the services report failure by returning [], so an array is never a
        //! real answer here — the success shape is an object keyed by genre.
        //! Anything else is a failed load rather than an empty catalogue, and
        //! those two deserve different words on screen.
        if (!data || Array.isArray(data)) {
            setEntries([]);
            setStatus("error");
            return;
        }

        setEntries(Object.entries(data));
        setStatus("ready");
    }, [fetcher]);

    useEffect(() => {
        let active = true;
        load(() => active);
        return () => { active = false; };
    }, [load]);

    //! wrapped rather than handed over directly: passed straight to onClick,
    //! load would receive the click event as its isActive argument
    const retry = useCallback(() => load(), [load]);

    return { entries, status, retry };
};

export default useCategoryRail;
