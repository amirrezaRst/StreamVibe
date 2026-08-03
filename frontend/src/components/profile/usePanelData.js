import { useEffect, useState } from "react";

/**
 * Each panel loads its own data the first time its tab is opened — the profile
 * shell only mounts the active one, so nothing is fetched for a tab the user
 * never visits.
 *
 * `loader` must be a stable reference (a service function, not an inline
 * arrow), otherwise this refetches on every render.
 */
const usePanelData = (loader) => {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let abandoned = false;

        loader()
            .then(data => { if (!abandoned) setItems(data); })
            .catch(err => { if (!abandoned) setError(err.message); });

        //! the user can switch tabs mid-request; don't write into an unmounted panel
        return () => { abandoned = true; };
    }, [loader]);

    return { items, error, loading: items === null && !error, setItems };
};

export default usePanelData;
