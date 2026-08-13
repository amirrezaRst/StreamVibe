"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";

import {
    createMovie, createSeries, fetchMovieDetail, fetchSeriesDetail,
    searchActors, searchDirectors, searchMusicians, updateMovie, updateSeries,
} from "@/services/AdminService";
import useFileUploadQueue from "@/hooks/useFileUploadQueue";
import PageHeader from "@/components/admin/PageHeader";
import PersonPicker from "@/components/admin/PersonPicker";
import ArtworkDropzone from "@/components/admin/upload/ArtworkDropzone";
import VideoFilesField from "@/components/admin/upload/VideoFilesField";
import { TrashIcon } from "@/assets/Svgs";

const GENRES = [
    "action", "comedy", "drama", "horror", "science fiction", "fantasy", "romance", "thriller",
    "mystery", "documentary", "adventure", "crime", "musical", "western", "animation", "war",
];
const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-PG", "TV-14", "TV-MA"];

const control = `w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5
    text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25 placeholder:text-c-grey-55`;

const Field = ({ label, required, error, hint, children }) => (
    <label className="block mb-3.5">
        <span className="block text-[11px] font-extrabold text-c-grey-65 mb-1.5">
            {label}{required && <span className="text-c-red-60 ml-0.5">*</span>}
        </span>
        {children}
        {error
            ? <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{error.message}</span>
            : hint && <span className="block text-[10.5px] text-c-grey-55 mt-1.5 leading-snug">{hint}</span>}
    </label>
);

const ChipGroup = ({ options, value, onToggle }) => (
    <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
            const on = value.includes(option);
            return (
                <button
                    key={option}
                    type="button"
                    onClick={() => onToggle(option)}
                    aria-pressed={on}
                    className={`text-[10.5px] font-bold py-1 px-2.5 rounded-full border capitalize duration-150
                        ${on ? "border-c-red-45 bg-c-red-45/[0.12] text-c-red-80" : "border-c-black-20 bg-c-black-06 text-c-grey-60 hover:text-c-grey-90"}`}
                >
                    {option}
                </button>
            );
        })}
    </div>
);

/**
 * One form for movies and series — the fields are ~90% identical (only
 * runtime and video files are movie-only) — used by /admin/movies/new,
 * /admin/movies/[id]/edit, /admin/series/new, and /admin/series/[id]/edit.
 *
 * Submission is two steps for a reason: the record (metadata + artwork) is
 * one multipart request, but each video file is its own — that is what makes
 * independent per-file progress, cancel, and retry possible at all (a single
 * combined request only reports total bytes across everything). So step one
 * creates/updates the record, step two uploads whatever video files were
 * staged, one request per file, against the record id step one returned.
 */
const TitleForm = ({ kind, id }) => {
    const router = useRouter();
    const isSeries = kind === "series";
    const editing = Boolean(id);

    const [loading, setLoading] = useState(editing);
    const [loadError, setLoadError] = useState(null);
    const [record, setRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [phase, setPhase] = useState("form"); // 'form' | 'uploading'
    const [fieldErrors, setFieldErrors] = useState({});

    const [genres, setGenres] = useState([]);
    const [category, setCategory] = useState([]);
    const [director, setDirector] = useState(null);
    const [musician, setMusician] = useState(null);
    const [actors, setActors] = useState([]);

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [trailerFile, setTrailerFile] = useState(null);

    const [removedFileUrls, setRemovedFileUrls] = useState(new Set());
    const queue = useFileUploadQueue();
    //! once a create succeeds this holds the new id, so a second submit (e.g.
    //! after a file failed and the admin fixes it and saves again) updates
    //! that record instead of creating a duplicate
    const [createdId, setCreatedId] = useState(null);
    const alreadySaved = editing || Boolean(createdId);

    const { register, handleSubmit, watch, getValues, control: formControl, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: "", description: "", release_date: "", duration: "",
            country: "", language: "", age_rating: "", production_company: "",
            rotten_rating: "", imdb_rating: "", top250rank: "",
            release_status: "now showing",
            awards: [],
            boxOffice: { budget: "", gross: "" },
        },
    });
    const awards = useFieldArray({ control: formControl, name: "awards" });

    useEffect(() => {
        if (!editing) return;
        let cancelled = false;

        (async () => {
            try {
                const data = isSeries ? await fetchSeriesDetail(id) : await fetchMovieDetail(id);
                if (cancelled) return;

                const item = isSeries ? data.series : data.movie;
                setRecord(item);
                reset({
                    title: item.title || "", description: item.description || "",
                    release_date: item.release_date || "", duration: item.duration || "",
                    country: item.country || "", language: item.language || "",
                    age_rating: item.age_rating || "", production_company: item.production_company || "",
                    rotten_rating: item.rotten_rating ?? "", imdb_rating: item.imdb_rating ?? "",
                    top250rank: item.top250rank ?? "", release_status: item.release_status || "now showing",
                    awards: item.awards || [],
                    boxOffice: { budget: item.boxOffice?.budget ?? "", gross: item.boxOffice?.gross ?? "" },
                });
                setGenres(item.genres || []);
                setCategory(item.category || []);
                setDirector(item.director || null);
                setMusician(item.musician || null);
                setActors(item.actors || []);
            } catch (error) {
                if (!cancelled) setLoadError(error.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [editing, id, isSeries, reset]);

    const toggle = (list, setList, value) =>
        setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

    const buildRecordFormData = (values) => {
        const formData = new FormData();
        //! text fields MUST be appended before any file field — multer's
        //! filename() callback reads req.body.title to name the file on disk,
        //! and multipart fields only parse in append order
        formData.append("title", values.title.trim());
        if (values.description) formData.append("description", values.description.trim());
        formData.append("release_date", values.release_date.trim());
        if (!isSeries) formData.append("duration", values.duration);
        genres.forEach((g) => formData.append("genres[]", g));
        category.forEach((c) => formData.append("category[]", c));
        formData.append("country", values.country.trim());
        formData.append("language", values.language.trim());
        if (values.age_rating) formData.append("age_rating", values.age_rating.trim());
        if (values.production_company) formData.append("production_company", values.production_company.trim());
        formData.append("rotten_rating", values.rotten_rating);
        formData.append("imdb_rating", values.imdb_rating);
        if (values.top250rank) formData.append("top250rank", values.top250rank);
        formData.append("release_status", values.release_status);
        formData.append("director", director?._id || "");
        if (musician?._id) formData.append("musician", musician._id);
        actors.forEach((a) => formData.append("actors[]", a._id));
        values.awards?.forEach((award, i) => {
            if (!award.name) return;
            formData.append(`awards[${i}][name]`, award.name);
            formData.append(`awards[${i}][year]`, award.year);
        });
        if (values.boxOffice.budget) formData.append("boxOffice[budget]", values.boxOffice.budget);
        if (values.boxOffice.gross) formData.append("boxOffice[gross]", values.boxOffice.gross);

        if (removedFileUrls.size) [...removedFileUrls].forEach((url) => formData.append("removeFileUrls[]", url));

        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
        if (coverFile) formData.append("cover", coverFile);
        if (trailerFile) formData.append("trailer", trailerFile);

        return formData;
    };

    const validateBeforeSubmit = () => {
        const found = {};
        if (!director) found.director = "Pick a director from the catalog.";
        if (genres.length === 0) found.genres = "Pick at least one genre.";
        if (category.length === 0) found.category = "Pick at least one category.";
        if (!alreadySaved) {
            if (!thumbnailFile) found.thumbnail = "A poster is required.";
            if (!coverFile) found.cover = "A cover image is required.";
            if (!trailerFile) found.trailer = "A trailer is required.";
        }
        setFieldErrors(found);
        return Object.keys(found).length === 0;
    };

    //! uploadFn passed down to VideoFilesField / the queue — bound to
    //! whichever id the record actually has (new or existing). Only movies
    //! carry video files, so this is never called for a series.
    //!
    //! title/release_date are included even though updateMovie never touches
    //! them here — multer's filename() callback (videoUploader.js) reads
    //! req.body.title/release_date to name the file on disk, and this request
    //! carries nothing else, so without them every file lands on disk named
    //! "undefined-undefined-<id>-streamvibe.mp4"
    const uploadFileFn = (targetId) => (file, quality, onProgress) => {
        const formData = new FormData();
        const current = getValues();
        formData.append("title", current.title);
        formData.append("release_date", current.release_date);
        formData.append("fileQualities", JSON.stringify([quality]));
        formData.append("files", file);
        return updateMovie(targetId, formData, { onProgress });
    };

    const runUploads = async (targetId) => {
        if (queue.items.length === 0) return { hasErrors: false };
        setPhase("uploading");
        return queue.uploadAll(uploadFileFn(targetId));
    };

    const onSubmit = async (values) => {
        if (!validateBeforeSubmit()) {
            toast.error("Some required fields are missing.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = buildRecordFormData(values);
            let savedId = id || createdId;

            if (alreadySaved) {
                const { promise } = isSeries ? updateSeries(savedId, formData) : updateMovie(savedId, formData);
                await promise;
                toast.success(`${values.title} saved`);
            } else {
                const { promise } = isSeries ? createSeries(formData) : createMovie(formData);
                const result = await promise;
                savedId = isSeries ? result.series._id : result.movie._id;
                setCreatedId(savedId);
                toast.success(`${values.title} created`);
            }

            if (!isSeries) {
                const { hasErrors } = await runUploads(savedId);
                if (hasErrors) {
                    toast.error("Some files didn't upload — retry them below, then save again.");
                    return;
                }
            }

            router.push(isSeries ? `/admin/series/${savedId}` : "/admin/movies");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
            setPhase("form");
        }
    };

    const existingFiles = useMemo(() => record?.files || [], [record]);

    const overall = useMemo(() => {
        const total = queue.items.reduce((sum, i) => sum + (i.total || 0), 0);
        const loaded = queue.items.reduce((sum, i) => sum + (i.status === "done" ? i.total : i.loaded || 0), 0);
        return { pct: total ? Math.min(100, (loaded / total) * 100) : 0, loaded, total };
    }, [queue.items]);

    if (loading) {
        return (
            <div className="p-[18px]">
                <div className="h-6 w-40 bg-c-black-10 rounded animate-pulse mb-4" />
                <div className="h-64 bg-c-black-10 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (loadError) {
        return <div className="p-[18px] text-c-grey-60 text-super-sm">{loadError}</div>;
    }

    //! noValidate hands every field's min/max/required entirely to
    //! react-hook-form, whose errors render inline via <Field error=…>.
    //! Without it, the browser's own constraint validation can silently
    //! block the whole submit — no request, no error near the Save button,
    //! nothing but an easy-to-miss native tooltip on whichever field tripped
    //! it — which is exactly what made a file upload look like it "did
    //! nothing" when a pre-existing rating's decimal value didn't match a
    //! numeric input's default step.
    return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <PageHeader
                crumbs={[{ label: "Catalog" }, { label: isSeries ? "Series" : "Movies", href: isSeries ? "/admin/series" : "/admin/movies" }]}
                title={alreadySaved ? `Edit ${record?.title || watch("title")}` : `New ${isSeries ? "series" : "movie"}`}
                subtitle={alreadySaved ? "Changes save to this record directly" : "Nothing is saved until you create it"}
            >
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-[7px] py-[7px] px-3.5 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                        text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-50"
                >
                    {phase === "uploading" ? "Uploading…" : submitting ? "Saving…" : alreadySaved ? "Save changes" : `Create ${isSeries ? "series" : "movie"}`}
                </button>
            </PageHeader>

            <div className="p-[18px] max-w-[820px]">
                <section className="mb-6">
                    <h3 className="text-[13.5px] font-extrabold text-white mb-3 pb-2 border-b border-c-black-15">Identity</h3>
                    <Field label="Title" required error={errors.title}>
                        <input className={control} placeholder="The Dark Knight" {...register("title", { required: "Title is required" })} />
                    </Field>
                    <Field label="Description">
                        <textarea rows={3} className={control} {...register("description")} />
                    </Field>
                    <div className={`grid ${isSeries ? "grid-cols-2" : "grid-cols-3"} gap-3`}>
                        <Field label="Release date" required error={errors.release_date}>
                            <input className={control} placeholder="2008" {...register("release_date", { required: "Required" })} />
                        </Field>
                        {!isSeries && (
                            <Field label="Runtime (min)" required error={errors.duration}>
                                <input type="number" min="1" className={control} {...register("duration", { required: "Required", min: { value: 1, message: "Must be positive" } })} />
                            </Field>
                        )}
                        <Field label="Status" required>
                            <select className={control} {...register("release_status")}>
                                <option value="now showing">now showing</option>
                                <option value="coming soon">coming soon</option>
                            </select>
                        </Field>
                    </div>
                </section>

                <section className="mb-6">
                    <h3 className="text-[13.5px] font-extrabold text-white mb-3 pb-2 border-b border-c-black-15">Artwork</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <ArtworkDropzone label="Poster" required={!alreadySaved} ratio="poster" file={thumbnailFile} existingUrl={record?.thumbnail} onChange={setThumbnailFile} error={fieldErrors.thumbnail} />
                        <ArtworkDropzone label="Cover" required={!alreadySaved} ratio="wide" file={coverFile} existingUrl={record?.cover} onChange={setCoverFile} error={fieldErrors.cover} />
                        <ArtworkDropzone label="Trailer" required={!alreadySaved} ratio="wide" video file={trailerFile} existingUrl={record?.trailer} onChange={setTrailerFile} error={fieldErrors.trailer} />
                    </div>
                    <span className="block text-[10.5px] text-c-grey-55 mt-2 leading-snug">
                        Poster is portrait (2:3), cover and trailer are widescreen. Images: jpg, png, webp. Video: mp4, mkv, webm, mov, avi.
                    </span>
                </section>

                <section className="mb-6">
                    <h3 className="text-[13.5px] font-extrabold text-white mb-3 pb-2 border-b border-c-black-15">Classification</h3>
                    <Field label="Genres" required>
                        <ChipGroup options={GENRES} value={genres} onToggle={(v) => toggle(genres, setGenres, v)} />
                        {fieldErrors.genres && <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{fieldErrors.genres}</span>}
                    </Field>
                    <Field label="Category" required>
                        <ChipGroup options={GENRES} value={category} onToggle={(v) => toggle(category, setCategory, v)} />
                        {fieldErrors.category && <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{fieldErrors.category}</span>}
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Country" required error={errors.country}>
                            <input className={control} {...register("country", { required: "Required" })} />
                        </Field>
                        <Field label="Language" required error={errors.language}>
                            <input className={control} {...register("language", { required: "Required" })} />
                        </Field>
                        <Field label="Age rating" required={!isSeries} error={errors.age_rating}>
                            <input className={control} list="age-ratings" {...register("age_rating", !isSeries ? { required: "Required" } : {})} />
                            <datalist id="age-ratings">
                                {AGE_RATINGS.map((r) => <option key={r} value={r} />)}
                            </datalist>
                        </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/*//! both ratings render through the same 5-star <StarRating> component
                            (components/singlePage/Rating.jsx) regardless of source — this app
                            scores everything out of 5, not IMDb's real 0–10 or Rotten Tomatoes'
                            real 0–100. Confirmed against the actual seed data (e.g. 4.2, 3.9).
                            step="0.1" matters as much as the range: without it a native number
                            input defaults to step="1" and silently blocks the whole form's submit
                            on any decimal value already in the data, with no visible error tied
                            to the Save button — that blocked an admin's upload entirely. */}
                        <Field label="IMDb" required error={errors.imdb_rating} hint="0–5">
                            <input type="number" step="0.1" min="0" max="5" className={control}
                                {...register("imdb_rating", { required: "Required", min: { value: 0, message: "0–5" }, max: { value: 5, message: "0–5" } })} />
                        </Field>
                        <Field label="Rotten Tomatoes" required error={errors.rotten_rating} hint="0–5">
                            <input type="number" step="0.1" min="0" max="5" className={control}
                                {...register("rotten_rating", { required: "Required", min: { value: 0, message: "0–5" }, max: { value: 5, message: "0–5" } })} />
                        </Field>
                        <Field label="Top 250 rank" hint="1–250, leave blank otherwise">
                            <input type="number" min="1" max="250" className={control} {...register("top250rank")} />
                        </Field>
                    </div>
                    <Field label="Production company">
                        <input className={control} {...register("production_company")} />
                    </Field>
                </section>

                <section className="mb-6">
                    <h3 className="text-[13.5px] font-extrabold text-white mb-3 pb-2 border-b border-c-black-15">People</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3.5">
                        <PersonPicker label="Director" required searchFn={searchDirectors} value={director} onChange={setDirector} placeholder="Search directors…" error={fieldErrors.director} />
                        <PersonPicker label="Composer" searchFn={searchMusicians} value={musician} onChange={setMusician} placeholder="Search composers…" />
                    </div>
                    <PersonPicker label="Cast" searchFn={searchActors} multiple value={actors} onChange={setActors} placeholder="Search actors…" />
                </section>

                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-c-black-15">
                        <h3 className="text-[13.5px] font-extrabold text-white">Awards</h3>
                        <button type="button" onClick={() => awards.append({ name: "", year: "" })}
                            className="text-[11px] font-bold text-c-grey-60 hover:text-c-grey-90">+ Add award</button>
                    </div>
                    {awards.fields.length === 0 && <p className="text-[11.5px] text-c-grey-55">None yet.</p>}
                    {awards.fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 mb-2.5">
                            <div className="flex-1">
                                <input className={control} placeholder="Academy Award for Best Picture" {...register(`awards.${index}.name`)} />
                            </div>
                            <div className="w-[110px]">
                                <input className={control} placeholder="2008" {...register(`awards.${index}.year`)} />
                            </div>
                            <button type="button" onClick={() => awards.remove(index)} aria-label="Remove award"
                                className="text-c-grey-55 hover:text-c-red-60 p-2">
                                <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3 mt-3.5">
                        <Field label="Box office budget ($)">
                            <input type="number" min="0" className={control} {...register("boxOffice.budget")} />
                        </Field>
                        <Field label="Box office gross ($)">
                            <input type="number" min="0" className={control} {...register("boxOffice.gross")} />
                        </Field>
                    </div>
                </section>

                {!isSeries && (
                    <section className="mb-6">
                        <h3 className="text-[13.5px] font-extrabold text-white mb-1 pb-2 border-b border-c-black-15">Video files</h3>
                        <p className="text-[11px] text-c-grey-55 mb-3">Optional — a title can exist before its files do.</p>

                        {phase === "uploading" && (
                            <div className="bg-c-black-10 border border-c-black-15 rounded-[9px] py-2.5 px-3 mb-3">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                    <b className="text-c-grey-90 font-extrabold">Uploading files…</b>
                                    <span className="text-c-grey-55 [font-variant-numeric:tabular-nums]">{Math.floor(overall.pct)}%</span>
                                </div>
                                <div className="h-[5px] rounded-full bg-c-black-15 overflow-hidden">
                                    <div className="h-full rounded-full bg-c-red-45 transition-[width]" style={{ width: `${overall.pct}%` }} />
                                </div>
                            </div>
                        )}

                        <VideoFilesField
                            queue={queue}
                            existingFiles={existingFiles}
                            removedUrls={removedFileUrls}
                            onRemoveExisting={(url) => setRemovedFileUrls((s) => new Set(s).add(url))}
                            onRestoreExisting={(url) => setRemovedFileUrls((s) => { const n = new Set(s); n.delete(url); return n; })}
                            disabled={phase === "uploading"}
                            onRetry={alreadySaved ? (itemId) => queue.uploadOne(itemId, uploadFileFn(id || createdId)) : undefined}
                        />
                    </section>
                )}
            </div>
        </form>
    );
};

export default TitleForm;
