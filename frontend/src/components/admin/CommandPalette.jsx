"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { searchConsole } from "@/services/AdminService";
import { SearchIcon } from "./AdminIcons";
import { NAV_ITEMS } from "./navigation";

const KIND_LABELS = {
    section: "Go to",
    bookings: "Bookings",
    movies: "Movies",
    series: "Series",
    people: "People",
    users: "Users",
};

//! the order results are grouped in. Bookings first because somebody typing a
//! code is reading it off a ticket with a customer waiting.
const KIND_ORDER = ["bookings", "section", "movies", "series", "people", "users"];

const Row = ({ entry, active, onPick, onHover }) => (
    <button
        type="button"
        onClick={() => onPick(entry)}
        onMouseMove={onHover}
        className={`flex items-center gap-2.5 w-full text-start py-2 px-2.5 rounded-[7px] duration-100
            ${active ? "bg-c-black-15" : ""}`}
    >
        {entry.image ? (
            <span className="w-6 h-[27px] rounded-[3px] overflow-hidden bg-c-black-12 shrink-0">
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${entry.image}`}
                    alt="" width={48} height={54}
                    className="w-full h-full object-cover"
                />
            </span>
        ) : entry.icon ? (
            <span className={`w-6 h-6 rounded-[5px] bg-c-black-12 flex items-center justify-center shrink-0
                ${active ? "text-c-red-60" : "text-c-grey-60"}`}>
                <entry.icon className="w-3.5 h-3.5" />
            </span>
        ) : (
            <span className="w-6 h-6 shrink-0" />
        )}

        <span className="min-w-0 flex-1">
            <span className={`block text-[12.5px] font-semibold truncate capitalize
                ${active ? "text-white" : "text-c-grey-90"}`}>
                {entry.label}
            </span>
            {entry.detail && (
                <span className="block text-[10.5px] text-c-black-30 truncate normal-case">{entry.detail}</span>
            )}
        </span>

        {entry.badge && (
            <span className="text-[9.5px] font-extrabold text-c-red-80 bg-c-red-45/[0.12] py-0.5 px-2 rounded-full shrink-0">
                {entry.badge}
            </span>
        )}
        {entry.shortcut && !active && (
            <kbd className="text-[9.5px] font-extrabold bg-c-black-12 border border-c-black-20 rounded px-1.5 text-c-black-30 shrink-0">
                g {entry.shortcut}
            </kbd>
        )}
        {active && (
            <span className="text-[9.5px] font-extrabold text-c-black-30 shrink-0">↵</span>
        )}
    </button>
);

/**
 * One box that reaches everything. Ten sections is past the point where hunting
 * down the rail beats typing three letters, and a booking code read out over
 * the phone should not require knowing which screen it lives on.
 *
 * Sections match locally and appear instantly; everything else comes from one
 * server query, so results never arrive in waves and reshuffle under the cursor.
 */
const CommandPalette = ({ open, onClose }) => {
    const router = useRouter();
    const [term, setTerm] = useState("");
    const [remote, setRemote] = useState(null);
    const [cursor, setCursor] = useState(0);
    const [searching, setSearching] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    //! a response for a term the user has already typed past must not replace
    //! the results for what they are looking at now
    const latest = useRef(0);

    useEffect(() => {
        if (!open) return;

        setTerm("");
        setRemote(null);
        setCursor(0);
        //! the input is mounted by this render, so focus waits a tick
        const timer = setTimeout(() => inputRef.current?.focus(), 10);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open || term.trim().length < 2) {
            setRemote(null);
            setSearching(false);
            return;
        }

        setSearching(true);
        const ticket = ++latest.current;
        const timer = setTimeout(async () => {
            try {
                const { results } = await searchConsole(term.trim());
                if (latest.current !== ticket) return;
                setRemote(results);
            } catch {
                if (latest.current === ticket) setRemote(null);
            } finally {
                if (latest.current === ticket) setSearching(false);
            }
        }, 180);

        return () => clearTimeout(timer);
    }, [term, open]);

    const sections = useMemo(() => {
        const needle = term.trim().toLowerCase();
        const matching = needle
            ? NAV_ITEMS.filter(item => item.label.toLowerCase().includes(needle))
            : NAV_ITEMS;

        return matching.map(item => ({
            _id: item.id,
            kind: "section",
            label: item.label,
            href: item.href,
            icon: item.icon,
            shortcut: item.shortcut,
        }));
    }, [term]);

    //! flattened once, so arrow keys walk the list the eye sees rather than
    //! jumping between groups
    const entries = useMemo(() => {
        const groups = { section: sections };
        if (remote) {
            Object.entries(remote).forEach(([kind, items]) => {
                if (items?.length) groups[kind] = items.map(item => ({ ...item, kind }));
            });
        }

        return KIND_ORDER.flatMap(kind => groups[kind] || []);
    }, [sections, remote]);

    useEffect(() => { setCursor(0); }, [entries.length]);

    const go = useCallback((entry) => {
        if (!entry) return;
        onClose();
        router.push(entry.href);
    }, [onClose, router]);

    useEffect(() => {
        if (!open) return;

        const onKey = (event) => {
            if (event.key === "Escape") { event.preventDefault(); onClose(); return; }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor(i => Math.min(i + 1, entries.length - 1));
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor(i => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
                event.preventDefault();
                go(entries[cursor]);
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, entries, cursor, go, onClose]);

    //! keep the highlighted row on screen as the arrows walk past the fold
    useEffect(() => {
        listRef.current?.querySelectorAll("[data-entry]")[cursor]
            ?.scrollIntoView({ block: "nearest" });
    }, [cursor]);

    if (!open) return null;

    let rendered = -1;

    return (
        <div
            className="fixed inset-0 bg-c-black-06/70 flex items-start justify-center pt-[12vh] px-4 z-[60]"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="w-full max-w-[520px] bg-c-black-10 border border-c-black-20 rounded-xl overflow-hidden
                    shadow-[0_32px_80px_-30px_rgba(0,0,0,0.95)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-2.5 py-3 px-3.5 border-b border-c-black-15">
                    <SearchIcon className="w-4 h-4 text-c-black-30 shrink-0" />
                    <input
                        ref={inputRef}
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        placeholder="Jump to a section, a title, a person, or a booking code"
                        className="bg-transparent flex-1 text-[13px] text-c-grey-90 placeholder:text-c-black-30 outline-none"
                    />
                    {searching && (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-c-black-20 border-t-c-red-45 animate-spin shrink-0" />
                    )}
                    <kbd className="text-[9.5px] font-extrabold bg-c-black-12 border border-c-black-20 rounded px-1.5 text-c-black-30 shrink-0">
                        Esc
                    </kbd>
                </div>

                <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
                    {entries.length === 0 ? (
                        <p className="text-[12.5px] text-c-grey-60 text-center py-8 px-4">
                            {term.trim().length < 2
                                ? "Type at least two characters."
                                : `Nothing matches “${term.trim()}”.`}
                        </p>
                    ) : (
                        KIND_ORDER.map(kind => {
                            const group = entries.filter(entry => entry.kind === kind);
                            if (!group.length) return null;

                            return (
                                <div key={kind} className="mb-1 last:mb-0">
                                    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-c-black-30 px-2.5 pt-2 pb-1">
                                        {KIND_LABELS[kind]}
                                    </p>
                                    {group.map(entry => {
                                        rendered += 1;
                                        const index = rendered;

                                        return (
                                            <span key={`${kind}-${entry._id}`} data-entry className="block">
                                                <Row
                                                    entry={entry}
                                                    active={index === cursor}
                                                    onPick={go}
                                                    onHover={() => setCursor(index)}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center gap-3.5 py-2 px-3.5 border-t border-c-black-15 bg-c-black-12
                    text-[10.5px] text-c-black-30">
                    <span><b className="text-c-grey-65">↑↓</b> move</span>
                    <span><b className="text-c-grey-65">↵</b> open</span>
                    <span><b className="text-c-grey-65">Esc</b> close</span>
                    <span className="ms-auto">Search covers titles, people, accounts and booking codes.</span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
