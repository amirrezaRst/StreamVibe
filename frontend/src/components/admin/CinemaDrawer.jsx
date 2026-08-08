"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { createCinema, updateCinema } from "@/services/AdminService";

//! the ones a venue plausibly has, offered as chips rather than a free-text
//! list — typing "Dolby atmos" and "Dolby Atmos" into different venues gives
//! you two amenities that are the same thing
const COMMON_AMENITIES = [
    "IMAX", "4DX", "Dolby Atmos", "Reclining seats",
    "Parking", "Bar", "Cafe", "Wheelchair access",
];

const Field = ({ label, hint, error, children }) => (
    <label className="block mb-3">
        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">{label}</span>
        {children}
        {error
            ? <span className="block text-[11px] text-c-red-80 mt-1">{error}</span>
            : hint && <span className="block text-[11px] text-c-grey-55 mt-1 leading-snug">{hint}</span>}
    </label>
);

const control = `w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5
    text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25 placeholder:text-c-grey-55`;

/**
 * One drawer for creating and editing a venue — the fields are identical and
 * the only difference is which endpoint it posts to.
 */
const CinemaDrawer = ({ cinema, onClose, onSaved }) => {
    const editing = Boolean(cinema);

    const [form, setForm] = useState(() => ({
        name: cinema?.name || "",
        city: cinema?.city || "",
        country: cinema?.country || "",
        address: cinema?.address || "",
        image: cinema?.image || "",
        amenities: cinema?.amenities || [],
        isActive: cinema?.isActive ?? true,
    }));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = (key, value) => {
        setForm(current => ({ ...current, [key]: value }));
        setErrors(current => ({ ...current, [key]: null }));
    };

    const toggleAmenity = (amenity) => setForm(current => ({
        ...current,
        amenities: current.amenities.includes(amenity)
            ? current.amenities.filter(a => a !== amenity)
            : [...current.amenities, amenity],
    }));

    //! mirrors the API's own rules, so the form catches what it can before
    //! spending a round trip on it
    const validate = () => {
        const found = {};
        if (form.name.trim().length < 2) found.name = "At least two characters.";
        if (form.city.trim().length < 2) found.city = "At least two characters.";
        if (form.country.trim().length < 2) found.country = "At least two characters.";
        if (form.address.trim().length < 4) found.address = "At least four characters.";

        setErrors(found);
        return Object.keys(found).length === 0;
    };

    const save = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                city: form.city.trim(),
                country: form.country.trim(),
                address: form.address.trim(),
                image: form.image.trim(),
                amenities: form.amenities,
                isActive: form.isActive,
            };

            const result = editing
                ? await updateCinema(cinema._id, payload)
                : await createCinema(payload);

            toast.success(editing ? "Venue saved" : `${payload.name} created`);
            onSaved(result.cinema);
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
                        {editing ? "Edit venue" : "New cinema"}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    <Field label="Name" error={errors.name}>
                        <input className={control} value={form.name} placeholder="Grand Central Cinemas"
                            onChange={(e) => set("name", e.target.value)} />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City" error={errors.city}>
                            <input className={control} value={form.city} placeholder="New York"
                                onChange={(e) => set("city", e.target.value)} />
                        </Field>
                        <Field label="Country" error={errors.country}>
                            <input className={control} value={form.country} placeholder="United States"
                                onChange={(e) => set("country", e.target.value)} />
                        </Field>
                    </div>

                    <Field label="Address" error={errors.address}
                        hint="What a customer would put into a map to find the door.">
                        <input className={control} value={form.address} placeholder="89 E 42nd St"
                            onChange={(e) => set("address", e.target.value)} />
                    </Field>

                    <Field label="Photo filename"
                        hint="A file already uploaded to the backend's public folder. Leave it empty and the card falls back to a plain gradient.">
                        <input className={control} value={form.image} placeholder="grand-central.jpg"
                            onChange={(e) => set("image", e.target.value)} />
                    </Field>

                    <div className="mb-3">
                        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">Amenities</span>
                        <div className="flex flex-wrap gap-1.5">
                            {COMMON_AMENITIES.map(amenity => {
                                const on = form.amenities.includes(amenity);

                                return (
                                    <button
                                        key={amenity}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity)}
                                        aria-pressed={on}
                                        className={`text-[11px] font-bold py-1 px-2.5 rounded-full border duration-150
                                            ${on
                                                ? "border-c-red-45 bg-c-red-45/[0.12] text-c-red-80"
                                                : "border-c-black-20 bg-c-black-06 text-c-grey-60 hover:text-c-grey-90"}`}
                                    >
                                        {amenity}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/*//! closing a venue keeps its halls and its history — it just
                        stops appearing to customers. Deleting one would take its
                        bookings with it, which is why that is not offered here. */}
                    <button
                        type="button"
                        onClick={() => set("isActive", !form.isActive)}
                        aria-pressed={form.isActive}
                        className="flex items-start gap-2.5 w-full text-start bg-c-black-06 border border-c-black-20
                            rounded-lg py-2.5 px-3 mt-1 hover:border-c-black-25 duration-150"
                    >
                        <span className={`w-[15px] h-[15px] rounded border-[1.5px] shrink-0 mt-px flex items-center justify-center duration-150
                            ${form.isActive ? "bg-[#3DA872] border-[#3DA872]" : "border-c-black-25"}`}>
                            {form.isActive && (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </span>
                        <span>
                            <span className="block text-[12.5px] font-semibold text-c-grey-90">Open to customers</span>
                            <span className="block text-[11px] text-c-grey-55 leading-snug mt-0.5">
                                A closed venue keeps its halls and bookings — it just stops being bookable.
                            </span>
                        </span>
                    </button>
                </div>

                <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                    <button type="button" onClick={save} disabled={saving}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                            text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40">
                        {saving ? "Saving…" : editing ? "Save venue" : "Create cinema"}
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
}

export default CinemaDrawer;
