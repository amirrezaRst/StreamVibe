"use client";

import { useCallback, useRef, useState } from "react";

let uid = 0;

/**
 * The backend takes one video file per request (movieUploader/episodeUploader
 * accept `files` on the same multipart body as everything else, but the
 * admin console calls it once per file so each gets its own XHR) — that's
 * what makes independent per-file progress, cancel, and retry possible at
 * all. This hook owns that queue: staged files, their upload state, and the
 * XHR handles needed to cancel one mid-transfer.
 */
const useFileUploadQueue = () => {
    const [items, setItems] = useState([]);
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const handles = useRef({});

    const addFiles = useCallback((files, defaultQuality = "1080p") => {
        setItems((current) => [
            ...current,
            ...files.map((file) => ({
                id: ++uid,
                file,
                quality: defaultQuality,
                status: "idle",
                loaded: 0,
                total: file.size,
                error: null,
            })),
        ]);
    }, []);

    const setQuality = useCallback((id, quality) => {
        setItems((current) => current.map((i) => (i.id === id ? { ...i, quality } : i)));
    }, []);

    const removeItem = useCallback((id) => {
        handles.current[id]?.();
        delete handles.current[id];
        setItems((current) => current.filter((i) => i.id !== id));
    }, []);

    const reset = useCallback(() => {
        Object.values(handles.current).forEach((cancel) => cancel());
        handles.current = {};
        setItems([]);
    }, []);

    //! uploadFn(file, quality, onProgress) must return { promise, cancel } —
    //! the shape uploadRequest/AdminService's create*/update* calls already have
    const uploadOne = useCallback(async (id, uploadFn) => {
        const item = itemsRef.current.find((i) => i.id === id);
        if (!item) return;

        setItems((current) => current.map((i) => (i.id === id ? { ...i, status: "uploading", error: null, loaded: 0 } : i)));

        const { promise, cancel } = uploadFn(item.file, item.quality, (progress) => {
            setItems((current) => current.map((i) => (i.id === id ? { ...i, loaded: progress.loaded, total: progress.total } : i)));
        });
        handles.current[id] = cancel;

        try {
            await promise;
            setItems((current) => current.map((i) => (i.id === id ? { ...i, status: "done", loaded: i.total } : i)));
        } catch (error) {
            const cancelled = error.name === "UploadAbortError";
            setItems((current) => current.map((i) => (i.id === id
                ? { ...i, status: cancelled ? "cancelled" : "error", error: cancelled ? null : error.message }
                : i)));
        } finally {
            delete handles.current[id];
        }
    }, []);

    //! uploadOne swallows its own errors into item.status rather than
    //! rejecting, so Promise.allSettled alone can't tell the caller anything —
    //! it re-reads itemsRef after every upload has settled to report whether
    //! any of them actually failed
    const uploadAll = useCallback(async (uploadFn) => {
        const targets = itemsRef.current.filter((i) => i.status !== "done");
        await Promise.allSettled(targets.map((i) => uploadOne(i.id, uploadFn)));
        return { hasErrors: itemsRef.current.some((i) => i.status === "error") };
    }, [uploadOne]);

    return { items, addFiles, setQuality, removeItem, reset, uploadOne, uploadAll };
};

export default useFileUploadQueue;
