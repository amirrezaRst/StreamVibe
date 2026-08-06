"use client";

import { useRef, useState } from "react";
import { seatLabel, tierOf } from "./seatTiers";

const RowTool = ({ label, title, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className="w-4 h-4 rounded bg-c-black-12 border border-c-black-20 text-c-grey-60
            hover:text-c-grey-90 text-[9px] flex items-center justify-center leading-none"
    >
        {label}
    </button>
);

/**
 * The hall itself. Click paints one seat, drag paints or selects a rectangle —
 * the two gestures a layout is actually built with.
 *
 * Pointer events rather than mouse events, so the same code works under a
 * finger; and the drag is tracked on the container rather than on each seat,
 * because a pointer moving fast skips over elements entirely.
 */
const SeatCanvas = ({
    seatMap, selected, sold, cursor, zoom,
    tool, onPaintSeat, onSelectRange, onToggleSeat, onSetCursor,
    onFillRow, onDuplicateRow, onRemoveRow,
}) => {
    const dragFrom = useRef(null);
    const [dragging, setDragging] = useState(false);

    const size = Math.round(16 * zoom);
    const gapSize = Math.round(5 * zoom);

    const at = (event) => {
        const el = event.target.closest("[data-seat]");
        if (!el) return null;
        return { row: Number(el.dataset.row), seat: Number(el.dataset.seatIndex) };
    };

    const handleDown = (event) => {
        const spot = at(event);
        if (!spot) return;

        event.preventDefault();
        dragFrom.current = spot;
        setDragging(true);
        onSetCursor(spot);

        if (tool === "select") {
            onSelectRange(spot, spot);
            return;
        }

        //! shift-click extends rather than replaces, the way a file list does
        if (event.shiftKey) {
            onToggleSeat(spot.row, spot.seat);
            return;
        }

        const row = seatMap[spot.row];
        onPaintSeat(row.row, row.seats[spot.seat].number);
    };

    const handleMove = (event) => {
        if (!dragging || !dragFrom.current) return;

        const spot = at(event);
        if (!spot) return;

        onSetCursor(spot);

        if (tool === "select") {
            onSelectRange(dragFrom.current, spot);
            return;
        }

        const row = seatMap[spot.row];
        onPaintSeat(row.row, row.seats[spot.seat].number);
    };

    const stop = () => { dragFrom.current = null; setDragging(false); };

    const widest = seatMap.reduce((max, row) => Math.max(max, row.seats.length), 0);

    return (
        <div className="p-4 overflow-x-auto select-none">
            <div className="h-[5px] mx-auto mb-1 rounded-full w-[56%]
                bg-gradient-to-r from-transparent via-c-black-25 to-transparent" />
            <p className="text-center text-[9.5px] font-extrabold tracking-[0.24em] uppercase text-c-black-30 mb-4">
                Screen
            </p>

            <div
                className="flex flex-col gap-[5px] items-center w-max mx-auto"
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={stop}
                onPointerLeave={stop}
            >
                {/*//! seat numbers along the top, so a seat can be found by eye
                    without counting across from the row label */}
                <div className="flex items-center gap-[5px] mb-0.5" style={{ gap: gapSize }}>
                    <span className="w-4 shrink-0" />
                    {Array.from({ length: widest }, (_, i) => (
                        <span key={i} className="text-center text-[8.5px] text-c-black-30 font-bold shrink-0"
                            style={{ width: size }}>
                            {i + 1}
                        </span>
                    ))}
                </div>

                {seatMap.map((row, rowIndex) => (
                    <div key={row.row} className="flex items-center group" style={{ gap: gapSize }}>
                        <span className="w-4 shrink-0 text-center text-[9.5px] text-c-black-30 font-extrabold">
                            {row.row}
                        </span>

                        {row.seats.map((seat, seatIndex) => {
                            const label = seatLabel(row.row, seat.number);
                            const isSelected = selected.has(label);
                            const isCursor = cursor.row === rowIndex && cursor.seat === seatIndex;
                            const isSold = sold.has(label) && !seat.disabled;
                            const tier = tierOf(seat.tier);

                            return (
                                <span
                                    key={seatIndex}
                                    data-seat=""
                                    data-row={rowIndex}
                                    data-seat-index={seatIndex}
                                    title={`${label}${seat.disabled ? " · gap" : ` · ${tier.label}`}${isSold ? " · booked" : ""}`}
                                    className={`block shrink-0 rounded-t-[3px] rounded-b-[2px] border relative cursor-pointer
                                        ${isSelected ? "outline outline-2 outline-c-red-45 outline-offset-1 z-[2]" : ""}
                                        ${isCursor ? "outline outline-2 outline-[#4C8DD9] outline-offset-1 z-[3]" : ""}`}
                                    style={{
                                        width: size,
                                        height: Math.round(size * 0.94),
                                        background: seat.disabled ? "transparent" : tier.fill,
                                        borderColor: seat.disabled ? "#333333" : tier.border,
                                        borderStyle: seat.disabled ? "dashed" : "solid",
                                    }}
                                >
                                    {/*//! a paid-for seat is marked, because the editor will refuse
                                        to turn it into a gap and that should not be a surprise */}
                                    {isSold && (
                                        <i className="absolute inset-[3px] rounded-[1px] bg-white/55 block" />
                                    )}
                                </span>
                            );
                        })}

                        <span className="flex gap-0.5 ms-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 duration-150">
                            <RowTool label="▤" title={`Fill row ${row.row} with the current tier`} onClick={() => onFillRow(rowIndex)} />
                            <RowTool label="⧉" title={`Duplicate row ${row.row}`} onClick={() => onDuplicateRow(rowIndex)} />
                            <RowTool label="×" title={`Delete row ${row.row}`} onClick={() => onRemoveRow(rowIndex)} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SeatCanvas;
