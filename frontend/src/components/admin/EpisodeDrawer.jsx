"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { createEpisode, updateEpisode } from "@/services/AdminService";
import useFileUploadQueue from "@/hooks/useFileUploadQueue";
import ArtworkDropzone from "@/components/admin/upload/ArtworkDropzone";
import VideoFilesField from "@/components/admin/upload/VideoFilesField";

const control = `w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5
    text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25 placeholder:text-c-grey-55`;

const Field = ({ label, required, error, hint, children }) => (
    <label className="block mb-3">
        <span className="block text-[11px] font-extrabold text-c-grey-65 mb-1.5">
            {label}{required && <span className="text-c-red-60 ml-0.5">*</span>}
        </span>
        {children}
        {error
            ? <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{error}</span>
            : hint && <span className="block text-[10.5px] text-c-grey-55 mt-1.5 leading-snug">{hint}</span>}
    </label>
);

/**
 * Create or edit one episode. Same two-phase submit as TitleForm (record
 * first, then one upload request per video file for independent progress) —
 * see the comment there for why that split exists.
 */
const EpisodeDrawer = ({ seriesId, seriesTitle, seasonNumber, episode, nextEpisodeNumber, onClose, onSaved }) => {
    const editing = Boolean(episode);

    const [title, setTitle] = useState(episode?.title || "");
    const [description, setDescription] = useState(episode?.description || "");
    const [runtime, setRuntime] = useState(episode?.runtime || "");
    const [episodeNumber, setEpisodeNumber] = useState(episode?.episodeNumber || nextEpisodeNumber);
    const [releaseDate, setReleaseDate] = useState(episode?.releaseDate || "");
    const [still1, setStill1] = useState(null);
    const [still2, setStill2] = useState(null);
    const [removedFileUrls, setRemovedFileUrls] = useState(new Set());
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [phase, setPhase] = useState("form");
    const [createdId, setCreatedId] = useState(null);

    const queue = useFileUploadQueue();
    const alreadySaved = editing || Boolean(createdId);
    const existingFiles = episode?.files || [];

    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    //! episodeNumber/seasonNumber/seriesTitle are included even though this
    //! request doesn't otherwise touch them — multer's filename() callback
    //! (videoUploader.js) branches into its episode-naming scheme only when
    //! req.body.episodeNumber is present, and needs the other two to build
    //! the name; without them the file would be named from the movie branch
    //! instead ("undefined-undefined-<id>-streamvibe.mp4")
    const uploadFileFn = (targetId) => (file, quality, onProgress) => {
        const formData = new FormData();
        formData.append("episodeNumber", episodeNumber);
        formData.append("seasonNumber", seasonNumber);
        formData.append("seriesTitle", seriesTitle);
        formData.append("fileQualities", JSON.stringify([quality]));
        formData.append("files", file);
        return updateEpisode(targetId, formData, { onProgress });
    };

    const validate = () => {
        const found = {};
        if (!title.trim()) found.title = "Required";
        if (!runtime || runtime <= 0) found.runtime = "Must be a positive number";
        if (!episodeNumber || episodeNumber <= 0) found.episodeNumber = "Must be a positive number";
        if (!alreadySaved && !still1) found.still1 = "At least one still is required";
        setErrors(found);
        return Object.keys(found).length === 0;
    };

    const save = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const formData = new FormData();
            //! text fields before files, same multer filename() ordering
            //! constraint as TitleForm
            formData.append("title", title.trim());
            if (description) formData.append("description", description.trim());
            formData.append("runtime", runtime);
            formData.append("episodeNumber", episodeNumber);
            if (releaseDate) formData.append("releaseDate", releaseDate.trim());
            if (!editing) {
                formData.append("seasonNumber", seasonNumber);
                formData.append("seriesTitle", seriesTitle);
                formData.append("series", seriesId);
            }
            if (removedFileUrls.size) [...removedFileUrls].forEach((url) => formData.append("removeFileUrls[]", url));
            if (still1) formData.append("pictures", still1);
            if (still2) formData.append("pictures", still2);

            let savedId = episode?._id || createdId;

            if (alreadySaved) {
                const { promise } = updateEpisode(savedId, formData);
                await promise;
                toast.success(`${title} saved`);
            } else {
                const { promise } = createEpisode(formData);
                const result = await promise;
                savedId = result.episode._id;
                setCreatedId(savedId);
                toast.success(`${title} created`);
            }

            if (queue.items.length > 0) {
                setPhase("uploading");
                const { hasErrors } = await queue.uploadAll(uploadFileFn(savedId));
                if (hasErrors) {
                    toast.error("Some files didn't upload — retry them below, then save again.");
                    return;
                }
            }

            onSaved();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
            setPhase("form");
        }
    };

    return (
        <div className="fixed inset-0 bg-c-black-06/60 flex justify-end z-50" onClick={onClose}>
            <div
                className="w-full max-w-[440px] bg-c-black-10 border-s border-c-black-20 flex flex-col h-full"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center gap-2.5 py-3 px-4 border-b border-c-black-15">
                    <h2 className="text-[14.5px] font-extrabold flex-1">{editing ? "Edit episode" : "New episode"}</h2>
                    <span className="text-[10.5px] font-bold text-c-grey-55 bg-c-black-06 border border-c-black-20 rounded-full py-0.5 px-2">
                        S{seasonNumber} · E{episodeNumber || "?"}
                    </span>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Episode №" required error={errors.episodeNumber}>
                            <input type="number" min="1" className={control} value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} />
                        </Field>
                        <Field label="Runtime (min)" required error={errors.runtime}>
                            <input type="number" min="1" className={control} value={runtime} onChange={(e) => setRuntime(e.target.value)} placeholder="48" />
                        </Field>
                    </div>
                    <Field label="Title" required error={errors.title}>
                        <input className={control} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter Nine: The Gate" />
                    </Field>
                    <Field label="Description">
                        <textarea rows={2} className={control} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </Field>
                    <Field label="Air date">
                        <input className={control} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} placeholder="2016-07-15" />
                    </Field>

                    <Field label="Stills" required={!alreadySaved} hint="At least one, up to two. Uploading a new one replaces both.">
                        <div className="grid grid-cols-2 gap-2.5">
                            <ArtworkDropzone label="" ratio="wide" file={still1} existingUrl={episode?.pictures?.[0]} onChange={setStill1} error={errors.still1} />
                            <ArtworkDropzone label="" ratio="wide" file={still2} existingUrl={episode?.pictures?.[1]} onChange={setStill2} />
                        </div>
                    </Field>

                    <Field label="Video files" hint="Optional — an episode can exist before its files do.">
                        {phase === "uploading" && (
                            <div className="bg-c-black-06 border border-c-black-20 rounded-[9px] py-2 px-2.5 mb-2 text-[11px] text-c-grey-60">
                                Uploading…
                            </div>
                        )}
                        <VideoFilesField
                            queue={queue}
                            existingFiles={existingFiles}
                            removedUrls={removedFileUrls}
                            onRemoveExisting={(url) => setRemovedFileUrls((s) => new Set(s).add(url))}
                            onRestoreExisting={(url) => setRemovedFileUrls((s) => { const n = new Set(s); n.delete(url); return n; })}
                            disabled={phase === "uploading"}
                            onRetry={alreadySaved ? (itemId) => queue.uploadOne(itemId, uploadFileFn(episode?._id || createdId)) : undefined}
                        />
                    </Field>
                </div>

                <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                    <button type="button" onClick={save} disabled={saving}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                            text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40">
                        {phase === "uploading" ? "Uploading…" : saving ? "Saving…" : alreadySaved ? "Save episode" : "Create episode"}
                    </button>
                    <button type="button" onClick={onClose}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-black-20
                            bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EpisodeDrawer;
