"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { fetchHall, saveSeatMap } from "@/services/AdminService";
import PageHeader from "@/components/admin/PageHeader";
import SeatCanvas from "@/components/admin/SeatCanvas";
import useSeatEditor from "@/components/admin/useSeatEditor";
import {
    GAP, PAINTS, TIERS, countByTier, countGaps, countSeats, generateGrid, seatLabel,
} from "@/components/admin/seatTiers";

const ToolButton = ({ active, disabled, title, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={`w-[26px] h-[26px] rounded-md border flex items-center justify-center duration-150
            disabled:opacity-35 disabled:cursor-not-allowed
            ${active
                ? "bg-c-red-45/[0.12] border-c-red-45/40 text-c-red-80"
                : "bg-c-black-10 border-c-black-20 text-c-grey-65 hover:text-c-grey-90"}`}
    >
        {children}
    </button>
);

const Divider = () => <span className="w-px h-[18px] bg-c-black-20 mx-1" />;

const Row = ({ label, value, big }) => (
    <div className="flex justify-between items-center py-[5px] border-b border-c-black-15 last:border-b-0 text-[11.5px]">
        <span className="text-c-black-30 flex items-center">{label}</span>
        <span className={`text-c-grey-90 font-bold tabular-nums ${big ? "text-sm" : ""}`}>{value}</span>
    </div>
);

const HallEditor = ({ cinemaId, hallId }) => {
    const router = useRouter();

    const [loaded, setLoaded] = useState(null);
    const [error, setError] = useState(null);
    const [paint, setPaint] = useState("premium");
    const [tool, setTool] = useState("paint");
    const [zoom, setZoom] = useState(1);
    const [saving, setSaving] = useState(false);
    const [showGrid, setShowGrid] = useState(false);

    useEffect(() => {
        fetchHall(hallId).then(setLoaded).catch(err => setError(err.message));
    }, [hallId]);

    if (error) {
        return (
            <>
                <PageHeader crumbs={[{ label: "Cinema" }]} title="Hall" subtitle="Could not load" />
                <div className="p-[18px]"><p className="text-c-grey-60 text-super-sm">{error}</p></div>
            </>
        );
    }

    if (!loaded) {
        return (
            <>
                <PageHeader crumbs={[{ label: "Cinema" }]} title="Hall" subtitle="Loading the seat map" />
                <div className="p-[18px]">
                    <div className="h-[420px] rounded-[10px] bg-c-black-10 border border-c-black-15 animate-pulse" />
                </div>
            </>
        );
    }

    return (
        <Editor
            cinemaId={cinemaId}
            hallId={hallId}
            loaded={loaded}
            paint={paint} setPaint={setPaint}
            tool={tool} setTool={setTool}
            zoom={zoom} setZoom={setZoom}
            saving={saving} setSaving={setSaving}
            showGrid={showGrid} setShowGrid={setShowGrid}
            router={router}
        />
    );
};

//! split out so the editor hook is only ever mounted with a real seat map —
//! initialising history from a placeholder and then replacing it would put an
//! empty hall on the undo stack
const Editor = ({
    cinemaId, hallId, loaded, paint, setPaint, tool, setTool,
    zoom, setZoom, saving, setSaving, showGrid, setShowGrid, router,
}) => {
    const editor = useSeatEditor(loaded.hall.seatMap, loaded.soldSeats);
    const { seatMap, selected, sold, cursor, dirty } = editor;

    const stats = useMemo(() => ({
        rows: seatMap.length,
        tiers: countByTier(seatMap),
        total: countSeats(seatMap),
        gaps: countGaps(seatMap),
    }), [seatMap]);

    //! every refusal comes back as a list of seats, and every one of them
    //! should say so rather than silently doing nothing
    const report = useCallback((blocked) => {
        if (!blocked?.length) return;

        toast.error(blocked.length === 1
            ? `${blocked[0]} is booked — it can't be removed.`
            : `${blocked.length} booked seats can't be removed: ${blocked.slice(0, 4).join(", ")}${blocked.length > 4 ? "…" : ""}`);
    }, []);

    const paintSeat = useCallback((row, number) => {
        report(editor.paintOne(row, number, paint));
    }, [editor, paint, report]);

    const applyToSelection = useCallback((paintId) => {
        if (!selected.size) return;
        report(editor.paintSelection(paintId));
    }, [editor, selected, report]);

    const save = async () => {
        setSaving(true);
        try {
            await saveSeatMap(hallId, seatMap);
            toast.success("Seat map saved");
            router.push(`/admin/cinemas/${cinemaId}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    /**
     * The whole editor from the home row. Laying out two hundred seats by
     * clicking each one is not a job anybody finishes, and reaching for the
     * mouse between every seat is most of why.
     */
    useEffect(() => {
        const onKey = (event) => {
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;

            const mod = event.metaKey || event.ctrlKey;

            if (mod && event.key.toLowerCase() === "z") {
                event.preventDefault();
                event.shiftKey ? editor.redo() : editor.undo();
                return;
            }
            if (mod && event.key.toLowerCase() === "a") {
                event.preventDefault();
                editor.selectAll();
                return;
            }
            if (mod && event.key.toLowerCase() === "s") {
                event.preventDefault();
                save();
                return;
            }
            if (mod) return;

            const move = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
            if (move) {
                event.preventDefault();
                const row = Math.min(Math.max(cursor.row + move[0], 0), seatMap.length - 1);
                const width = seatMap[row]?.seats.length || 1;
                const seat = Math.min(Math.max(cursor.seat + move[1], 0), width - 1);

                //! shift extends from wherever the cursor was, so a run of
                //! seats can be picked without touching the mouse
                if (event.shiftKey) editor.selectRange(cursor, { row, seat });
                editor.setCursor({ row, seat });
                return;
            }

            const byKey = PAINTS.find(option => option.key === event.key);
            if (byKey) {
                event.preventDefault();
                setPaint(byKey.id);

                //! painting the selection if there is one, otherwise the seat
                //! under the cursor — pressing 2 should always paint something
                if (selected.size) {
                    report(editor.paintSelection(byKey.id));
                } else {
                    const row = seatMap[cursor.row];
                    const seat = row?.seats[cursor.seat];
                    if (seat) report(editor.paintOne(row.row, seat.number, byKey.id));
                }
                return;
            }

            if (event.key === "Escape") editor.setSelected(new Set());
            if (event.key.toLowerCase() === "b") setTool("paint");
            if (event.key.toLowerCase() === "m") setTool("select");
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [editor, cursor, seatMap, selected, setPaint, setTool, report]);

    //! an accidental back button should not discard twenty minutes of layout
    useEffect(() => {
        if (!dirty) return;

        const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    return (
        <>
            <PageHeader
                crumbs={[
                    { label: "Cinema" },
                    { label: "Cinemas", href: "/admin/cinemas" },
                    { label: loaded.hall.cinema?.name || "Venue", href: `/admin/cinemas/${cinemaId}` },
                ]}
                title={`${loaded.hall.name} · seat map`}
                subtitle={`${loaded.hall.screenType} · ${stats.total} bookable seats${dirty ? " · unsaved changes" : ""}`}
            >
                <button
                    type="button"
                    onClick={() => router.push(`/admin/cinemas/${cinemaId}`)}
                    className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold border border-c-black-20
                        bg-c-black-10 text-c-grey-90 hover:border-c-black-25 duration-150"
                >
                    Discard
                </button>
                <button
                    type="button"
                    onClick={save}
                    disabled={!dirty || saving}
                    className="rounded-[7px] py-[7px] px-3 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                        text-white hover:bg-c-red-45/85 duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving…" : "Save layout"}
                </button>
            </PageHeader>

            <div className="p-[18px]">
                <div className="grid xl:grid-cols-[1fr_232px] gap-3">
                    <div className="bg-c-black-06 border border-c-black-15 rounded-[10px] overflow-hidden">
                        <div className="flex items-center gap-1.5 py-[7px] px-2.5 border-b border-c-black-15 bg-c-black-12 flex-wrap">
                            <ToolButton active={tool === "paint"} title="Paint (B)" onClick={() => setTool("paint")}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18.4 2.6a2 2 0 0 1 3 3L10 17l-4 1 1-4z" />
                                </svg>
                            </ToolButton>
                            <ToolButton active={tool === "select"} title="Rectangle select (M)" onClick={() => setTool("select")}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                </svg>
                            </ToolButton>

                            <Divider />

                            <ToolButton disabled={!editor.canUndo} title="Undo (⌘Z)" onClick={editor.undo}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                                </svg>
                            </ToolButton>
                            <ToolButton disabled={!editor.canRedo} title="Redo (⇧⌘Z)" onClick={editor.redo}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                                </svg>
                            </ToolButton>

                            <Divider />

                            <button type="button" onClick={editor.addRow}
                                className="text-[11.5px] font-bold text-c-grey-65 hover:text-c-grey-90 px-2 duration-150">
                                + Row
                            </button>
                            <button type="button" onClick={editor.addColumn}
                                className="text-[11.5px] font-bold text-c-grey-65 hover:text-c-grey-90 px-2 duration-150">
                                + Column
                            </button>
                            <button type="button" onClick={() => report(editor.removeColumn())}
                                className="text-[11.5px] font-bold text-c-grey-65 hover:text-c-grey-90 px-2 duration-150">
                                − Column
                            </button>
                            <button type="button" onClick={() => setShowGrid(true)}
                                className="text-[11.5px] font-bold text-c-grey-65 hover:text-c-grey-90 px-2 duration-150">
                                Generate grid…
                            </button>

                            <span className="ms-auto flex items-center gap-1.5 text-[11px] text-c-black-30 tabular-nums">
                                <ToolButton title="Zoom out" onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}>−</ToolButton>
                                {Math.round(zoom * 100)}%
                                <ToolButton title="Zoom in" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>+</ToolButton>
                            </span>
                        </div>

                        {seatMap.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-c-grey-90 text-sm font-semibold mb-1.5">This hall has no seats yet</p>
                                <p className="text-c-grey-60 text-[12.5px] mb-4 max-w-[40ch] mx-auto">
                                    Start from a grid and cut the aisles into it — that is how almost every hall is shaped.
                                </p>
                                <button type="button" onClick={() => setShowGrid(true)}
                                    className="bg-c-red-45 hover:bg-c-red-45/85 text-white rounded-[7px] py-2 px-4 text-xs font-bold duration-150">
                                    Generate a grid
                                </button>
                            </div>
                        ) : (
                            <SeatCanvas
                                seatMap={seatMap}
                                selected={selected}
                                sold={sold}
                                cursor={cursor}
                                zoom={zoom}
                                tool={tool}
                                onPaintSeat={paintSeat}
                                onSelectRange={editor.selectRange}
                                onToggleSeat={(rowIndex, seatIndex) => {
                                    const row = seatMap[rowIndex];
                                    editor.toggleSeat(row.row, row.seats[seatIndex].number);
                                }}
                                onSetCursor={editor.setCursor}
                                onFillRow={(rowIndex) => report(editor.fillRow(rowIndex, paint))}
                                onDuplicateRow={editor.duplicateRow}
                                onRemoveRow={(rowIndex) => report(editor.removeRow(rowIndex))}
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3">
                            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-black-30 mb-2.5">
                                Paint tier
                            </h3>
                            {PAINTS.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => { setPaint(option.id); applyToSelection(option.id); }}
                                    aria-pressed={paint === option.id}
                                    className={`flex items-center gap-2 w-full py-[7px] px-2.5 rounded-[7px] border text-xs mb-1.5 duration-150
                                        ${paint === option.id
                                            ? "border-c-red-45 bg-c-red-45/[0.12] text-white"
                                            : "border-c-black-15 bg-c-black-06 text-c-grey-65 hover:text-c-grey-90"}`}
                                >
                                    <span
                                        className="w-[13px] h-3 rounded-[3px] shrink-0"
                                        style={{
                                            background: option.fill,
                                            border: option.id === "gap" ? "1px dashed #404040" : "none",
                                        }}
                                    />
                                    {option.label}
                                    <kbd className="ms-auto text-[9.5px] font-extrabold bg-c-black-12 border border-c-black-20 rounded px-[5px] text-c-grey-60">
                                        {option.key}
                                    </kbd>
                                </button>
                            ))}
                        </div>

                        {selected.size > 0 && (
                            <div className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3">
                                <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-black-30 mb-2">
                                    Selection
                                </h3>
                                <p className="text-[11.5px] text-c-grey-60 leading-relaxed mb-2.5">
                                    <b className="text-c-grey-90">{selected.size} seat{selected.size === 1 ? "" : "s"}</b> —
                                    pick a tier above to apply it to all of them.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => editor.setSelected(new Set())}
                                    className="text-[11px] font-bold text-c-grey-60 hover:text-c-grey-90 duration-150"
                                >
                                    Clear selection (Esc)
                                </button>
                            </div>
                        )}

                        <div className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3">
                            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-black-30 mb-2">
                                This hall
                            </h3>
                            <Row label="Rows" value={stats.rows} />
                            {TIERS.map(tier => (
                                <Row
                                    key={tier.id}
                                    label={
                                        <>
                                            <i className="w-[9px] h-2 rounded-sm inline-block me-1.5" style={{ background: tier.fill }} />
                                            {tier.label}
                                        </>
                                    }
                                    value={stats.tiers[tier.id] || 0}
                                />
                            ))}
                            <Row label="Bookable" value={stats.total} big />
                            <Row label="Gaps" value={stats.gaps} />
                        </div>

                        {loaded.upcomingShowtimes > 0 && (
                            <div className="flex gap-2 items-start bg-[#D99A34]/[0.14] border border-[#D99A34]/30
                                rounded-lg py-2.5 px-3 text-[11.5px] leading-relaxed text-[#E8B663]">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" className="shrink-0 mt-px">
                                    <path d="M12 9v4M12 17h.01" />
                                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                                </svg>
                                <span>
                                    <b>{loaded.upcomingShowtimes} screening{loaded.upcomingShowtimes === 1 ? "" : "s"} scheduled here.</b>{" "}
                                    {sold.size > 0
                                        ? `${sold.size} seat${sold.size === 1 ? " is" : "s are"} already booked and can't be removed — they carry a white centre.`
                                        : "Nothing is booked yet, so the whole map is free to change."}
                                </span>
                            </div>
                        )}

                        <details className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3">
                            <summary className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-c-black-30 cursor-pointer">
                                Keyboard
                            </summary>
                            <div className="flex flex-col gap-1.5 mt-2.5 text-[11px] text-c-grey-60">
                                {[
                                    ["← ↑ ↓ →", "move the cursor"],
                                    ["⇧ + arrows", "extend the selection"],
                                    ["1 2 3", "paint a tier"],
                                    ["0", "turn into a gap"],
                                    ["B / M", "paint / select tool"],
                                    ["⌘Z / ⇧⌘Z", "undo / redo"],
                                    ["⌘A", "select the whole hall"],
                                    ["Esc", "clear the selection"],
                                    ["⌘S", "save"],
                                ].map(([key, what]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <kbd className="text-[9.5px] font-extrabold bg-c-black-12 border border-c-black-20
                                            border-b-2 rounded px-1.5 text-c-grey-90 min-w-[22px] text-center">
                                            {key}
                                        </kbd>
                                        {what}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {showGrid && (
                <GenerateGrid
                    onClose={() => setShowGrid(false)}
                    onGenerate={(options) => {
                        editor.replaceMap(generateGrid(options));
                        setShowGrid(false);
                        toast.success(`${options.rows * options.seatsPerRow} seats laid out`);
                    }}
                    hasSeats={seatMap.length > 0}
                />
            )}
        </>
    );
};

const GenerateGrid = ({ onClose, onGenerate, hasSeats }) => {
    const [rows, setRows] = useState(8);
    const [seatsPerRow, setSeatsPerRow] = useState(12);
    const [aisleEvery, setAisleEvery] = useState(0);

    const total = rows * seatsPerRow;
    const aisles = aisleEvery ? rows * Math.floor((seatsPerRow - 1) / aisleEvery) : 0;

    return (
        <div className="fixed inset-0 bg-c-black-06/70 flex items-center justify-center p-5 z-50" onClick={onClose}>
            <div
                className="w-full max-w-[380px] bg-c-black-10 border border-c-black-20 rounded-xl p-5
                    shadow-[0_32px_80px_-30px_rgba(0,0,0,0.95)]"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 className="text-[15px] font-extrabold mb-1">Generate a grid</h3>
                <p className="text-[12.5px] text-c-grey-60 mb-4 leading-relaxed">
                    A rectangular starting layout to cut the aisles into.
                    {hasSeats && <b className="text-[#E8B663]"> This replaces the current map.</b>}
                </p>

                {[
                    ["Rows", rows, setRows, 1, 30],
                    ["Seats per row", seatsPerRow, setSeatsPerRow, 1, 40],
                    ["Aisle every N seats", aisleEvery, setAisleEvery, 0, 20],
                ].map(([label, value, setter, min, max]) => (
                    <label key={label} className="block mb-3">
                        <span className="block text-[11.5px] font-bold text-c-grey-65 mb-1.5">{label}</span>
                        <input
                            type="number"
                            min={min}
                            max={max}
                            value={value}
                            onChange={(event) => setter(Math.min(Math.max(Number(event.target.value) || 0, min), max))}
                            className="w-full bg-c-black-06 border border-c-black-20 rounded-[7px] py-2 px-3
                                text-[12.5px] text-c-grey-90 outline-none focus:border-c-black-25 tabular-nums"
                        />
                    </label>
                ))}

                <p className="text-[11.5px] text-c-black-30 mb-4">
                    {total} seats{aisles > 0 && `, ${aisles} of them turned into aisle gaps`}.
                </p>

                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold border border-c-black-20
                            bg-c-black-12 text-c-grey-65 hover:text-c-grey-90 duration-150">
                        Cancel
                    </button>
                    <button type="button" onClick={() => onGenerate({ rows, seatsPerRow, aisleEvery })}
                        className="rounded-[7px] py-2 px-3.5 text-xs font-bold bg-c-red-45 border border-c-red-45
                            text-white hover:bg-c-red-45/85 duration-150">
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HallEditor;
