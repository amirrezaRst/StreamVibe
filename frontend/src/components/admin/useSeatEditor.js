"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { nextRowLabel, seatLabel } from "./seatTiers";

const MAX_HISTORY = 60;

/**
 * The seat map as an editable document: what is selected, what has been done to
 * it, and how to undo that.
 *
 * Every mutation goes through `commit`, which is what makes undo possible at
 * all — a change applied directly to state is a change no history knows about.
 */
const useSeatEditor = (initialMap, soldSeats = []) => {
    const [seatMap, setSeatMap] = useState(initialMap);
    const [selected, setSelected] = useState(new Set());
    const [cursor, setCursor] = useState({ row: 0, seat: 0 });

    //! two stacks rather than one pointer: redo is simply what undo popped
    const past = useRef([]);
    const future = useRef([]);
    const [, forceRender] = useState(0);

    const sold = useMemo(() => new Set(soldSeats), [soldSeats]);
    const [baseline] = useState(() => JSON.stringify(initialMap));
    const dirty = JSON.stringify(seatMap) !== baseline;

    const commit = useCallback((next) => {
        setSeatMap(current => {
            past.current = [...past.current.slice(-MAX_HISTORY), current];
            future.current = [];
            return typeof next === "function" ? next(current) : next;
        });
        forceRender(n => n + 1);
    }, []);

    const undo = useCallback(() => {
        if (!past.current.length) return;

        setSeatMap(current => {
            future.current = [current, ...future.current];
            const previous = past.current[past.current.length - 1];
            past.current = past.current.slice(0, -1);
            return previous;
        });
        setSelected(new Set());
        forceRender(n => n + 1);
    }, []);

    const redo = useCallback(() => {
        if (!future.current.length) return;

        setSeatMap(current => {
            past.current = [...past.current, current];
            const [next, ...rest] = future.current;
            future.current = rest;
            return next;
        });
        setSelected(new Set());
        forceRender(n => n + 1);
    }, []);

    /**
     * Apply a paint to a set of seats. A tier is a property of a seat; "gap" is
     * the absence of one, so it maps to `disabled` rather than to a tier.
     *
     * Seats already sold are skipped when the paint would remove them, and
     * reported back so the caller can say why nothing happened.
     */
    const paint = useCallback((labels, paintId) => {
        const blocked = [];

        commit(current => current.map(row => ({
            ...row,
            seats: row.seats.map(seat => {
                const label = seatLabel(row.row, seat.number);
                if (!labels.has(label)) return seat;

                if (paintId === "gap") {
                    //! the one thing the editor refuses outright: a seat
                    //! somebody has paid for cannot be turned into a walkway
                    if (sold.has(label)) { blocked.push(label); return seat; }
                    return { ...seat, disabled: true };
                }

                return { ...seat, tier: paintId, disabled: false };
            }),
        })));

        return blocked;
    }, [commit, sold]);

    const paintSelection = useCallback((paintId) => {
        if (!selected.size) return [];
        return paint(selected, paintId);
    }, [paint, selected]);

    const paintOne = useCallback((row, seat, paintId) =>
        paint(new Set([seatLabel(row, seat)]), paintId), [paint]);

    //! whole-row and whole-hall operations, which is how most of a layout
    //! actually gets built
    const fillRow = useCallback((rowIndex, paintId) => {
        const row = seatMap[rowIndex];
        if (!row) return [];
        return paint(new Set(row.seats.map(seat => seatLabel(row.row, seat.number))), paintId);
    }, [seatMap, paint]);

    const addRow = useCallback(() => {
        commit(current => {
            const width = current.length ? Math.max(...current.map(row => row.seats.length)) : 10;
            return [...current, {
                row: nextRowLabel(current),
                seats: Array.from({ length: width }, (_, i) => ({ number: i + 1, tier: "standard", disabled: false })),
            }];
        });
    }, [commit]);

    const duplicateRow = useCallback((rowIndex) => {
        commit(current => {
            const source = current[rowIndex];
            if (!source) return current;

            const copy = {
                row: nextRowLabel(current),
                seats: source.seats.map(seat => ({ ...seat })),
            };
            return [...current.slice(0, rowIndex + 1), copy, ...current.slice(rowIndex + 1)];
        });
    }, [commit]);

    const removeRow = useCallback((rowIndex) => {
        const row = seatMap[rowIndex];
        if (!row) return [];

        const blocked = row.seats
            .filter(seat => !seat.disabled && sold.has(seatLabel(row.row, seat.number)))
            .map(seat => seatLabel(row.row, seat.number));

        if (blocked.length) return blocked;

        commit(current => current.filter((_, i) => i !== rowIndex));
        return [];
    }, [seatMap, sold, commit]);

    const addColumn = useCallback(() => {
        commit(current => current.map(row => ({
            ...row,
            seats: [...row.seats, {
                number: row.seats.length ? Math.max(...row.seats.map(seat => seat.number)) + 1 : 1,
                tier: "standard",
                disabled: false,
            }],
        })));
    }, [commit]);

    const removeColumn = useCallback(() => {
        const blocked = [];
        seatMap.forEach(row => {
            const last = row.seats[row.seats.length - 1];
            if (last && !last.disabled && sold.has(seatLabel(row.row, last.number))) {
                blocked.push(seatLabel(row.row, last.number));
            }
        });
        if (blocked.length) return blocked;

        commit(current => current.map(row => ({ ...row, seats: row.seats.slice(0, -1) })));
        return [];
    }, [seatMap, sold, commit]);

    const replaceMap = useCallback((next) => {
        commit(next);
        setSelected(new Set());
    }, [commit]);

    //! selection helpers — a rectangle between two seats is the shape almost
    //! every real edit takes
    const selectRange = useCallback((from, to) => {
        const rowFrom = Math.min(from.row, to.row), rowTo = Math.max(from.row, to.row);
        const seatFrom = Math.min(from.seat, to.seat), seatTo = Math.max(from.seat, to.seat);

        const labels = new Set();
        for (let r = rowFrom; r <= rowTo; r++) {
            const row = seatMap[r];
            if (!row) continue;
            for (let s = seatFrom; s <= seatTo; s++) {
                if (row.seats[s]) labels.add(seatLabel(row.row, row.seats[s].number));
            }
        }
        setSelected(labels);
    }, [seatMap]);

    const selectAll = useCallback(() => {
        setSelected(new Set(seatMap.flatMap(row => row.seats.map(seat => seatLabel(row.row, seat.number)))));
    }, [seatMap]);

    const toggleSeat = useCallback((row, number) => {
        const label = seatLabel(row, number);
        setSelected(current => {
            const next = new Set(current);
            if (next.has(label)) next.delete(label); else next.add(label);
            return next;
        });
    }, []);

    return {
        seatMap, setSeatMap,
        selected, setSelected, selectRange, selectAll, toggleSeat,
        cursor, setCursor,
        sold, dirty,
        canUndo: past.current.length > 0,
        canRedo: future.current.length > 0,
        undo, redo,
        paintSelection, paintOne,
        fillRow, addRow, duplicateRow, removeRow, addColumn, removeColumn, replaceMap,
    };
};

export default useSeatEditor;
