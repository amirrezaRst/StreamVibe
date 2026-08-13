"use client";

import { useEffect, useRef, useState } from "react";
import { VideoFileIcon } from "@/assets/Svgs";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

/**
 * One artwork slot — poster, cover, or trailer. `file` is a staged File the
 * parent form is holding (controlled); `existingUrl` is what's already saved
 * on the record in edit mode. A freshly-picked file always wins over
 * whatever was there before.
 */
const RATIO_CLASSES = {
    poster: "w-[62px] aspect-[2/3]",
    //! a headshot, not a movie still — square and small enough to read as a
    //! face-sized crop rather than a landscape frame. Matches the 600x600
    //! square the backend's sharp pipeline actually produces for people.
    avatar: "w-[62px] aspect-square",
};

const ArtworkDropzone = ({ label, hint, required, ratio, accept, video = false, file, existingUrl, onChange, error }) => {
    const inputRef = useRef(null);
    const [hot, setHot] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file || video) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file, video]);

    const filled = Boolean(file || existingUrl);
    const ratioClass = RATIO_CLASSES[ratio] || "w-full aspect-video";
    const rounded = ratio === "avatar";

    const pick = (fileList) => {
        const picked = fileList?.[0];
        if (picked) onChange(picked);
    };

    return (
        <label className="block">
            {label && (
                <span className="block text-[11px] font-extrabold text-c-grey-65 mb-1.5">
                    {label}{required && <span className="text-c-red-60 ml-0.5">*</span>}
                </span>
            )}

            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                onDragOver={(e) => { e.preventDefault(); setHot(true); }}
                onDragLeave={() => setHot(false)}
                onDrop={(e) => { e.preventDefault(); setHot(false); pick(e.dataTransfer.files); }}
                className={`border-[1.5px] rounded-[10px] bg-c-black-06 p-3.5 text-center cursor-pointer transition-colors
                    ${filled ? "border-solid border-c-black-20" : "border-dashed"}
                    ${hot ? "border-c-red-45 bg-c-red-45/[0.04]" : !filled ? "border-c-black-25 hover:border-c-black-30" : "hover:border-c-black-25"}
                    ${error ? "!border-c-red-45" : ""}`}
            >
                <div className={`mx-auto mb-2 ${rounded ? "rounded-full" : "rounded-[6px]"} bg-c-black-12 border border-c-black-20 grid place-items-center text-c-grey-55 overflow-hidden ${ratioClass}`}>
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : !video && existingUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${IMAGE_URL}/${existingUrl}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <VideoFileIcon className="w-[18px] h-[18px]" aria-hidden="true" />
                    )}
                </div>
                <div className="text-[11.5px] font-bold text-c-grey-90">
                    {file ? file.name : existingUrl || (video ? "Drop a video, or click to browse" : "Drop an image, or click to browse")}
                </div>
                {filled && <div className="text-[10px] text-[#6FA8E8] font-bold mt-1">{video ? "Replace" : "Replace"}</div>}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept || (video ? ".mp4,.mkv,.webm,.mov,.avi" : ".jpg,.jpeg,.png,.webp")}
                    className="hidden"
                    onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
                />
            </div>
            {error
                ? <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{error}</span>
                : hint && <span className="block text-[10.5px] text-c-grey-55 mt-1.5 leading-snug">{hint}</span>}
        </label>
    );
};

export default ArtworkDropzone;
