"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";

import { createActor, createDirector, updateActor, updateDirector } from "@/services/AdminService";
import { fetchActor } from "@/services/ActorService";
import { fetchDirector } from "@/services/DirectorService";
import ArtworkDropzone from "@/components/admin/upload/ArtworkDropzone";
import { TrashIcon } from "@/assets/Svgs";

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

const emptyValues = {
    fullName: "", birthDate: "", birthPlace: "", country: "", bio: "", gender: "", awards: [],
};

/**
 * One drawer for actors and directors — the two collections are the same
 * shape, `kind` (passed down from PeopleContent's toggle, not stored on the
 * row itself) is what picks the endpoint and which fields are actually
 * required.
 *
 * Director requires birthPlace/country at the model level; actor doesn't.
 * That's surfaced as a required marker that changes with `kind` rather than
 * a separate field set per kind — the two forms are identical otherwise, and
 * a duplicated layout would drift the moment one of them changes.
 *
 * The row list (`PeopleContent`) is a lean, credit-count-annotated
 * projection — it doesn't carry birthPlace/bio/awards, so editing re-fetches
 * the full record by id before the form can render real values.
 */
const PersonDrawer = ({ kind, person, onClose, onSaved }) => {
    const directors = kind === "directors";
    const editing = Boolean(person);
    const label = directors ? "director" : "actor";

    const [loading, setLoading] = useState(editing);
    const [record, setRecord] = useState(null);
    const [profileFile, setProfileFile] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, control: formControl, reset, formState: { errors } } = useForm({
        defaultValues: emptyValues,
    });
    const awards = useFieldArray({ control: formControl, name: "awards" });

    useEffect(() => {
        if (!editing) return;
        let cancelled = false;

        (async () => {
            try {
                const data = directors ? await fetchDirector(person._id) : await fetchActor(person._id);
                if (cancelled) return;

                const item = directors ? data.director : data.actor;
                setRecord(item);
                reset({
                    fullName: item.fullName || "", birthDate: item.birthDate || "",
                    birthPlace: item.birthPlace || "", country: item.country || "",
                    bio: item.bio || "", gender: item.gender || "",
                    awards: item.awards || [],
                });
            } catch (error) {
                toast.error(error.message);
                onClose();
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, directors, person?._id]);

    const buildFormData = (values) => {
        const formData = new FormData();
        formData.append("fullName", values.fullName.trim());
        formData.append("birthDate", values.birthDate);
        if (values.birthPlace) formData.append("birthPlace", values.birthPlace.trim());
        if (values.country) formData.append("country", values.country.trim());
        if (values.bio) formData.append("bio", values.bio.trim());
        formData.append("gender", values.gender);
        values.awards?.forEach((award, i) => {
            if (!award.name) return;
            formData.append(`awards[${i}][name]`, award.name);
            formData.append(`awards[${i}][year]`, award.year);
        });
        if (profileFile) formData.append("profile", profileFile);
        return formData;
    };

    const onSubmit = async (values) => {
        if (!editing && !profileFile) {
            setProfileError("A photo is required.");
            return;
        }
        setProfileError(null);
        setSaving(true);

        try {
            const formData = buildFormData(values);
            const { promise } = editing
                ? (directors ? updateDirector(person._id, formData) : updateActor(person._id, formData))
                : (directors ? createDirector(formData) : createActor(formData));

            const result = await promise;
            toast.success(editing ? `${values.fullName} saved` : `${values.fullName} added`);
            onSaved(directors ? result.director : result.actor);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-c-black-06/60 flex justify-end z-50" onClick={onClose}>
            <div
                className="w-full max-w-[440px] bg-c-black-10 border-s border-c-black-20 flex flex-col h-full"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center gap-2.5 py-3 px-4 border-b border-c-black-15">
                    <h2 className="text-[14.5px] font-extrabold flex-1">
                        {editing ? `Edit ${label}` : `New ${label}`}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                {loading ? (
                    <div className="flex-1 grid place-items-center">
                        <span className="text-[12px] text-c-grey-55">Loading…</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="flex gap-3 mb-1">
                                <ArtworkDropzone
                                    label="Photo"
                                    required={!editing}
                                    ratio="avatar"
                                    accept=".jpg,.jpeg,.png"
                                    file={profileFile}
                                    existingUrl={record?.profile}
                                    onChange={(picked) => { setProfileFile(picked); setProfileError(null); }}
                                    error={profileError}
                                    hint="Square headshot. jpg or png."
                                />
                                <div className="flex-1">
                                    <Field label="Full name" required error={errors.fullName}>
                                        <input className={control} placeholder="Florence Pugh"
                                            {...register("fullName", { required: "Required", minLength: { value: 3, message: "At least 3 characters." } })} />
                                    </Field>
                                    <Field label="Gender" required error={errors.gender}>
                                        <select className={control} {...register("gender", { required: "Required" })}>
                                            <option value="">Select…</option>
                                            <option value="female">Female</option>
                                            <option value="male">Male</option>
                                        </select>
                                    </Field>
                                </div>
                            </div>

                            <Field label="Birth date" required error={errors.birthDate}>
                                <input type="date" className={control} {...register("birthDate", { required: "Required" })} />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Birth place"
                                    required={directors}
                                    error={errors.birthPlace}
                                    hint={!directors ? "Optional for actors." : undefined}
                                >
                                    <input className={control} placeholder="Oxford, England"
                                        {...register("birthPlace", directors ? { required: "Required for directors." } : {})} />
                                </Field>
                                <Field
                                    label="Country"
                                    required={directors}
                                    error={errors.country}
                                    hint={!directors ? "Optional for actors." : undefined}
                                >
                                    <input className={control} placeholder="United Kingdom"
                                        {...register("country", directors ? { required: "Required for directors." } : {})} />
                                </Field>
                            </div>

                            <Field label="Biography">
                                <textarea rows={3} className={`${control} resize-none`} placeholder="A short career summary…"
                                    {...register("bio")} />
                            </Field>

                            <div className="mt-1">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-c-black-15">
                                    <span className="text-[11.5px] font-extrabold text-c-grey-65">Awards</span>
                                    <button type="button" onClick={() => awards.append({ name: "", year: "" })}
                                        className="text-[11px] font-bold text-c-grey-60 hover:text-c-grey-90">+ Add award</button>
                                </div>
                                {awards.fields.length === 0 && <p className="text-[11.5px] text-c-grey-55 mb-1">None yet.</p>}
                                {awards.fields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-2 mb-2">
                                        <div className="flex-1">
                                            <input className={control} placeholder="BAFTA Rising Star"
                                                {...register(`awards.${index}.name`)} />
                                        </div>
                                        <div className="w-[90px]">
                                            <input className={control} placeholder="2020"
                                                {...register(`awards.${index}.year`)} />
                                        </div>
                                        <button type="button" onClick={() => awards.remove(index)} aria-label="Remove award"
                                            className="text-c-grey-55 hover:text-c-red-60 p-2">
                                            <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                            <button type="submit" disabled={saving}
                                className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                                    text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40">
                                {saving ? "Saving…" : editing ? `Save ${label}` : `Add ${label}`}
                            </button>
                            <button type="button" onClick={onClose}
                                className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-black-20
                                    bg-c-black-10 text-c-grey-65 hover:text-c-grey-90 duration-150">
                                Cancel
                            </button>
                        </footer>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PersonDrawer;
