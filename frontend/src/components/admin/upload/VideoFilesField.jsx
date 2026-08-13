"use client";

import { useRef, useState } from "react";
import { AlertTriangleIcon, CheckIcon, TrashIcon, UploadCloudIcon, VideoFileIcon } from "@/assets/Svgs";

const QUALITIES = ["360p", "480p", "720p", "1080p", "4K"];
const VIDEO_ACCEPT = ".mp4,.mkv,.webm,.mov,.avi";

const fmtSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
};

const qualitySelect = "bg-c-black-06 border border-c-black-20 text-c-grey-90 rounded-[5px] text-[10.5px] font-bold py-0.5 px-1.5 outline-none";

/**
 * The staged/uploading/existing video files for one movie or episode. Purely
 * presentational — `queue` is a useFileUploadQueue() instance, and existing
 * files (already on the record) are passed in separately since they don't go
 * through the same upload lifecycle.
 */
const VideoFilesField = ({ queue, existingFiles = [], removedUrls, onRemoveExisting, onRestoreExisting, disabled, onRetry }) => {
    const [hot, setHot] = useState(false);
    const inputRef = useRef(null);

    const handleFiles = (fileList) => {
        const files = [...fileList].filter((f) => VIDEO_ACCEPT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext)));
        if (files.length) queue.addFiles(files);
    };

    return (
        <div>
            <div
                role="button"
                tabIndex={0}
                aria-label="Add video files"
                onClick={() => !disabled && inputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                onDragOver={(e) => { e.preventDefault(); setHot(true); }}
                onDragLeave={() => setHot(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setHot(false);
                    handleFiles(e.dataTransfer.files);
                }}
                className={`border-[1.5px] border-dashed rounded-[10px] bg-c-black-06 py-5 px-4 text-center cursor-pointer transition-colors
                    ${hot ? "border-c-red-45 bg-c-red-45/[0.04]" : "border-c-black-25 hover:border-c-black-30"}
                    ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
                <UploadCloudIcon className="w-6 h-6 text-c-grey-55 mx-auto mb-2" aria-hidden="true" />
                <div className="text-[13px] font-extrabold text-c-grey-90">Drop video files here</div>
                <div className="text-[11px] text-c-grey-55 mt-1">One file per quality · up to 2 GB each · mp4, mkv, webm, mov, avi</div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={VIDEO_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
            </div>

            {existingFiles.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-2">
                    {existingFiles.map((f) => {
                        const removed = removedUrls.has(f.url);
                        return (
                            <div
                                key={f.url}
                                className={`flex items-center gap-2.5 border rounded-[9px] py-2.5 px-3 text-[12px]
                                    ${removed ? "border-c-red-45/40 bg-c-red-45/[0.05] opacity-60" : "border-c-black-15 bg-c-black-10"}`}
                            >
                                <VideoFileIcon className="w-4 h-4 text-c-grey-55 shrink-0" aria-hidden="true" />
                                <span className={`flex-1 truncate font-bold ${removed ? "line-through text-c-grey-55" : "text-c-grey-90"}`}>
                                    {f.url}
                                </span>
                                <span className="text-c-grey-55 font-bold text-[10.5px] shrink-0">{f.quality}</span>
                                {removed ? (
                                    <button type="button" onClick={() => onRestoreExisting(f.url)} className="text-[10.5px] font-bold text-c-grey-60 hover:text-c-grey-90 shrink-0">
                                        Undo
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => onRemoveExisting(f.url)} aria-label={`Remove ${f.url}`} className="text-c-grey-55 hover:text-c-red-60 shrink-0">
                                        <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {queue.items.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-2">
                    {queue.items.map((item) => {
                        const pct = item.total ? Math.min(100, (item.loaded / item.total) * 100) : 0;
                        const done = item.status === "done";
                        const errored = item.status === "error";
                        const uploading = item.status === "uploading";

                        return (
                            <div
                                key={item.id}
                                className={`flex items-start gap-2.5 border rounded-[9px] py-2.5 px-3
                                    ${errored ? "border-c-red-45/45 bg-c-red-45/[0.05]" : done ? "border-[#3DA872]/35" : "border-c-black-15"} bg-c-black-10`}
                            >
                                <span className={`w-7 h-7 rounded-[7px] shrink-0 grid place-items-center
                                    ${errored ? "bg-c-red-45/[0.12] text-c-red-60" : done ? "bg-[#3DA872]/[0.12] text-[#3DA872]" : "bg-[#4C8DD9]/[0.12] text-[#4C8DD9]"}`}
                                >
                                    {done ? <CheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                        : errored ? <AlertTriangleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                            : <VideoFileIcon className="w-3.5 h-3.5" aria-hidden="true" />}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className="text-[12px] font-bold text-c-grey-97 truncate max-w-[220px]">{item.file.name}</span>
                                        {!done && (
                                            <select
                                                className={qualitySelect}
                                                value={item.quality}
                                                onChange={(e) => queue.setQuality(item.id, e.target.value)}
                                                disabled={uploading}
                                                aria-label={`Quality for ${item.file.name}`}
                                            >
                                                {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                                            </select>
                                        )}
                                        {done && <span className="text-[10.5px] font-bold text-c-grey-55">{item.quality}</span>}
                                        <span className="text-[10.5px] text-c-grey-55 [font-variant-numeric:tabular-nums]">{fmtSize(item.total)}</span>
                                    </div>
                                    <div className="h-[5px] rounded-full bg-c-black-15 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-[width] ${errored ? "bg-c-red-45/50" : done ? "bg-[#3DA872]" : "bg-c-red-45"}`}
                                            style={{ width: `${done ? 100 : pct}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-c-grey-55 [font-variant-numeric:tabular-nums]">
                                        <span className="font-extrabold text-c-grey-90 min-w-[30px]">{done ? 100 : Math.floor(pct)}%</span>
                                        {errored && <span className="text-c-red-80 font-bold">{item.error || "Upload failed"}</span>}
                                        {done && <span className="text-[#3DA872] font-bold">Uploaded</span>}
                                        {item.status === "idle" && <span>Waiting</span>}
                                        {item.status === "cancelled" && <span>Cancelled</span>}
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1">
                                    {errored && onRetry && (
                                        <button
                                            type="button"
                                            onClick={() => onRetry(item.id)}
                                            className="text-[10.5px] font-bold text-c-red-60 hover:text-c-red-80 py-1 px-1.5"
                                        >
                                            Retry
                                        </button>
                                    )}
                                    {!uploading && (
                                        <button type="button" onClick={() => queue.removeItem(item.id)} aria-label={`Remove ${item.file.name}`} className="text-c-grey-55 hover:text-c-grey-90 p-1">
                                            <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                        </button>
                                    )}
                                    {uploading && (
                                        <button type="button" onClick={() => queue.removeItem(item.id)} className="text-[10.5px] font-bold text-c-grey-60 hover:text-c-grey-90 py-1 px-1.5">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VideoFilesField;
