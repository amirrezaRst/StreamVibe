"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Everything a console list does apart from drawing itself: fetch a page, hold
 * the search term, the sort, the selection, and reload after something changes.
 *
 * `loader` must be stable — a service function, not an inline arrow — or this
 * refetches on every render.
 */
const useListState = (loader, { extraParams, initialSort } = {}) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState(initialSort || null);
    const [selected, setSelected] = useState(new Set());

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    //! `extraParams` is usually an object literal, so it is a new value on every
    //! render — comparing its contents is what stops an endless refetch loop
    const paramSignature = JSON.stringify(extraParams || {});
    //! a response for a request the user has already moved on from must not
    //! overwrite the one they are waiting for
    const latest = useRef(0);

    const load = useCallback(async () => {
        const ticket = ++latest.current;

        try {
            const params = { page, limit: 20, ...JSON.parse(paramSignature) };
            if (search) params.search = search;
            if (sort) { params.sort = sort.field; params.order = sort.order; }

            const result = await loader(params);
            if (latest.current !== ticket) return;

            setData(result);
            setError(null);
        } catch (err) {
            if (latest.current !== ticket) return;
            setError(err.message);
        }
    }, [loader, page, search, sort, paramSignature]);

    //! typing should not fire a request per keystroke; everything else should
    //! answer immediately
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            load();
            return;
        }

        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [load]);

    //! changing what is being asked for invalidates both the page you were on
    //! and anything ticked on it
    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [search, paramSignature]);

    const rows = data?.items || data?.users || data?.reviews || data?.bookings || [];

    const toggle = (id) => setSelected(current => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const toggleAll = () => setSelected(current =>
        rows.length && rows.every(row => current.has(row._id))
            ? new Set()
            : new Set(rows.map(row => row._id))
    );

    //! clicking the column you are already sorted by flips the direction
    const changeSort = (field) => setSort(current =>
        current?.field === field
            ? { field, order: current.order === "asc" ? "desc" : "asc" }
            : { field, order: "asc" }
    );

    //! after a write: reload, and drop a selection that may no longer exist
    const refresh = async () => {
        setSelected(new Set());
        await load();
    };

    //! wraps a write so every caller gets the same busy handling and reload
    const run = async (action) => {
        setBusy(true);
        try {
            await action();
            await refresh();
            return true;
        } finally {
            setBusy(false);
        }
    };

    return {
        rows,
        pagination: data?.pagination,
        counts: data?.counts,
        //! what the current filter is actually worth, for the lists that carry it
        totals: data?.totals,
        loading: !data && !error,
        error,
        busy,
        page, setPage,
        search, setSearch,
        sort, changeSort,
        selected, toggle, toggleAll, clearSelection: () => setSelected(new Set()),
        refresh, run,
    };
};

export default useListState;
