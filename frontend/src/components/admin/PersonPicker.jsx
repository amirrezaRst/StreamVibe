"use client";

import { useEffect, useRef, useState } from "react";
import { XmarkIcon } from "@/assets/Svgs";

/**
 * A searchable combobox over one of the browse endpoints (director/actor/
 * musician), single- or multi-select. Only people already in the catalog can
 * be picked — there's no "create new" here, since that's a separate form
 * this one has no business improvising.
 */
const PersonPicker = ({ label, required, searchFn, multiple = false, value, onChange, placeholder, error }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        let cancelled = false;
        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                const { people } = await searchFn(query.trim());
                if (!cancelled) setResults(people || []);
            } catch {
                if (!cancelled) setResults([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [query, searchFn]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const selected = multiple ? (value || []) : value;
    const pick = (person) => {
        if (multiple) {
            if (!selected.some((p) => p._id === person._id)) onChange([...selected, person]);
        } else {
            onChange(person);
        }
        setQuery("");
        setResults([]);
        setOpen(false);
    };

    const removeOne = (id) => {
        if (multiple) onChange(selected.filter((p) => p._id !== id));
        else onChange(null);
    };

    return (
        <div className="relative" ref={boxRef}>
            <span className="block text-[11px] font-extrabold text-c-grey-65 mb-1.5">
                {label}{required && <span className="text-c-red-60 ml-0.5">*</span>}
            </span>

            {!multiple && selected ? (
                <div className="flex items-center gap-2 bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-2.5">
                    <span className="flex-1 text-[12.5px] text-c-grey-90 font-semibold truncate">{selected.fullName}</span>
                    <button type="button" onClick={() => removeOne(selected._id)} aria-label={`Clear ${label}`} className="text-c-grey-55 hover:text-c-grey-90">
                        <XmarkIcon className="w-3 h-3" aria-hidden="true" />
                    </button>
                </div>
            ) : (
                <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className={`w-full bg-c-black-06 border rounded-[7px] py-2 px-2.5 text-[12.5px] text-c-grey-90
                        outline-none focus:border-c-black-25 placeholder:text-c-grey-55
                        ${error ? "border-c-red-45" : "border-c-black-20"}`}
                />
            )}

            {multiple && selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.map((p) => (
                        <span key={p._id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-c-grey-90
                            bg-c-black-10 border border-c-black-20 py-1 px-2 rounded-full">
                            {p.fullName}
                            <button type="button" onClick={() => removeOne(p._id)} aria-label={`Remove ${p.fullName}`} className="text-c-grey-55 hover:text-c-red-60">
                                <XmarkIcon className="w-2.5 h-2.5" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {open && query.trim() && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-c-black-10 border border-c-black-20 rounded-[9px]
                    shadow-2xl shadow-black/50 max-h-[220px] overflow-y-auto">
                    {loading ? (
                        <div className="py-3 px-3 text-[11.5px] text-c-grey-55">Searching…</div>
                    ) : results.length === 0 ? (
                        <div className="py-3 px-3 text-[11.5px] text-c-grey-55">No one found — they may need adding under Catalog → People first.</div>
                    ) : (
                        results.map((person) => (
                            <button
                                key={person._id}
                                type="button"
                                onClick={() => pick(person)}
                                className="w-full text-left py-2 px-3 text-[12px] font-semibold text-c-grey-90 hover:bg-c-black-15"
                            >
                                {person.fullName}
                                {person.country && <span className="text-c-grey-55 font-normal"> · {person.country}</span>}
                            </button>
                        ))
                    )}
                </div>
            )}

            {error && <span className="block text-[10.5px] text-c-red-80 font-bold mt-1.5">{error}</span>}
        </div>
    );
};

export default PersonPicker;
