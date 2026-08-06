"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { createHall } from "@/services/AdminService";
import { generateGrid } from "./seatTiers";

const SCREEN_TYPES = ["2D", "3D", "IMAX", "4DX"];

const Field = ({ label, hint, error, children }) => (
    <label className="block mb-3">
        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">{label}</span>
        {children}
        {error
            ? <span className="block text-[11px] text-c-red-80 mt-1">{error}</span>
            : hint && <span className="block text-[11px] text-c-black-30 mt-1 leading-snug">{hint}</span>}
    </label>
);

const control = `w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5
    text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25 placeholder:text-c-black-30`;

/**
 * A new hall, with its first layout laid out in the same breath. A hall with no
 * seat map cannot be screened in, so creating one and then having to go
 * elsewhere to make it usable is a gap nobody wants to walk through — the grid
 * options here are the same ones the editor offers, just applied up front.
 */
const HallDrawer = ({ cinemaId, existingNames = [], onClose, onSaved }) => {
    const [name, setName] = useState("");
    const [screenType, setScreenType] = useState("2D");
    const [withLayout, setWithLayout] = useState(true);
    const [rows, setRows] = useState(8);
    const [seatsPerRow, setSeatsPerRow] = useState(12);
    const [aisleEvery, setAisleEvery] = useState(0);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const taken = existingNames.some(existing => existing.toLowerCase() === name.trim().toLowerCase());
    const totalSeats = rows * seatsPerRow;
    const aisles = aisleEvery ? rows * Math.floor((seatsPerRow - 1) / aisleEvery) : 0;

    const save = async () => {
        const found = {};
        if (name.trim().length < 1) found.name = "A hall needs a name.";
        //! two halls with the same name in one venue makes every schedule row
        //! and every ticket ambiguous
        else if (taken) found.name = "This venue already has a hall by that name.";

        setErrors(found);
        if (Object.keys(found).length) return;

        setSaving(true);
        try {
            const result = await createHall({
                cinema: cinemaId,
                name: name.trim(),
                screenType,
                seatMap: withLayout ? generateGrid({ rows, seatsPerRow, aisleEvery }) : [],
            });

            toast.success(withLayout
                ? `${name.trim()} created with ${totalSeats - aisles} seats`
                : `${name.trim()} created — build its seat map next`);
            onSaved(result.hall);
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
                className="w-full max-w-[420px] bg-c-black-10 border-s border-c-black-20 flex flex-col h-full"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center gap-2.5 py-3 px-4 border-b border-c-black-15">
                    <h2 className="text-[14.5px] font-extrabold flex-1">New hall</h2>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="text-c-grey-60 hover:text-c-grey-90 text-lg leading-none px-1 duration-150">
                        ✕
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    <Field label="Name" error={errors.name}
                        hint="What appears on a ticket and on the schedule — “Hall 1”, “Screen 3”.">
                        <input className={control} value={name} placeholder="Hall 1"
                            onChange={(e) => { setName(e.target.value); setErrors({}); }} />
                    </Field>

                    <div className="mb-3">
                        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">Screen type</span>
                        <div className="flex gap-1.5">
                            {SCREEN_TYPES.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setScreenType(type)}
                                    aria-pressed={screenType === type}
                                    className={`flex-1 text-[11.5px] font-bold py-1.5 rounded-[7px] border duration-150
                                        ${screenType === type
                                            ? "border-c-red-45 bg-c-red-45/[0.12] text-c-red-80"
                                            : "border-c-black-20 bg-c-black-06 text-c-grey-60 hover:text-c-grey-90"}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setWithLayout(current => !current)}
                        aria-pressed={withLayout}
                        className="flex items-start gap-2.5 w-full text-start bg-c-black-06 border border-c-black-20
                            rounded-lg py-2.5 px-3 mb-3 hover:border-c-black-25 duration-150"
                    >
                        <span className={`w-[15px] h-[15px] rounded border-[1.5px] shrink-0 mt-px flex items-center justify-center duration-150
                            ${withLayout ? "bg-c-red-45 border-c-red-45" : "border-c-black-25"}`}>
                            {withLayout && (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </span>
                        <span>
                            <span className="block text-[12.5px] font-semibold text-c-grey-90">Lay out a starting grid</span>
                            <span className="block text-[11px] text-c-black-30 leading-snug mt-0.5">
                                A hall with no seats cannot be screened in. You can reshape it in the editor afterwards.
                            </span>
                        </span>
                    </button>

                    {withLayout && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Rows">
                                    <input type="number" min="1" max="30" className={`${control} tabular-nums`} value={rows}
                                        onChange={(e) => setRows(Math.min(Math.max(Number(e.target.value) || 0, 1), 30))} />
                                </Field>
                                <Field label="Seats per row">
                                    <input type="number" min="1" max="40" className={`${control} tabular-nums`} value={seatsPerRow}
                                        onChange={(e) => setSeatsPerRow(Math.min(Math.max(Number(e.target.value) || 0, 1), 40))} />
                                </Field>
                            </div>

                            <Field label="Aisle every N seats"
                                hint="Zero for no aisles. An aisle is a seat marked as a gap, so numbering stays continuous.">
                                <input type="number" min="0" max="20" className={`${control} tabular-nums`} value={aisleEvery}
                                    onChange={(e) => setAisleEvery(Math.min(Math.max(Number(e.target.value) || 0, 0), 20))} />
                            </Field>

                            <p className="text-[11.5px] text-c-black-30">
                                <b className="text-c-grey-65">{totalSeats - aisles}</b> bookable seats
                                {aisles > 0 && `, ${aisles} gaps cut as aisles`}. Every seat starts as standard.
                            </p>
                        </>
                    )}
                </div>

                <footer className="flex gap-2 py-2.5 px-4 border-t border-c-black-15 bg-c-black-12">
                    <button type="button" onClick={save} disabled={saving}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                            text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40">
                        {saving ? "Creating…" : "Create hall"}
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

export default HallDrawer;
