"use client";

const Checkbox = ({ checked, indeterminate }) => (
    <span className={`w-[15px] h-[15px] rounded-[3px] border-[1.5px] shrink-0 inline-flex items-center justify-center align-middle duration-150
        ${checked || indeterminate ? "bg-c-red-45 border-c-red-45" : "border-c-black-25"}`}>
        {indeterminate
            ? <span className="w-[7px] h-[1.5px] bg-white rounded-sm block" />
            : checked && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
    </span>
);

const SortArrow = ({ direction }) => (
    <span className="text-c-red-60 ms-1 inline-block">{direction === "asc" ? "↑" : "↓"}</span>
);

/**
 * One table for every list in the console. What changes between sections is the
 * column definitions and the row actions; the selection, sorting, paging and
 * empty states are the same everywhere, so they live here once.
 *
 * Sorting and searching are the caller's job to turn into query parameters —
 * this component never filters the rows it was handed, because filtering the
 * twenty rows you can see is a lie when there are two hundred behind them.
 */
const DataTable = ({
    columns,
    rows,
    rowKey = (row) => row._id,
    loading,
    error,
    empty,
    sort,
    onSortChange,
    selectable = true,
    selected,
    onToggle,
    onToggleAll,
    rowActions,
    pagination,
    onPageChange,
}) => {
    if (loading) {
        return (
            <div className="border border-c-black-15 rounded-[10px] overflow-hidden bg-c-black-10">
                <div className="h-[38px] bg-c-black-12 border-b border-c-black-15" />
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-[49px] border-b border-c-black-15 last:border-b-0 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-dashed border-c-black-20 rounded-xl py-10 text-center">
                <p className="text-c-grey-90 text-sm font-semibold mb-1">Couldn&apos;t load this list</p>
                <p className="text-c-grey-60 text-[12.5px] mb-4">{error}</p>
                {onPageChange && (
                    <button
                        type="button"
                        onClick={() => onPageChange(pagination?.page || 1)}
                        className="bg-c-black-12 border border-c-black-20 hover:border-c-black-25 text-c-grey-90 rounded-[7px] py-1.5 px-4 text-xs font-bold duration-150"
                    >
                        Try again
                    </button>
                )}
            </div>
        );
    }

    if (!rows.length) return empty;

    const allSelected = selectable && selected && rows.length > 0 && rows.every(row => selected.has(rowKey(row)));
    const someSelected = selectable && selected && !allSelected && rows.some(row => selected.has(rowKey(row)));

    return (
        <div className="border border-c-black-15 rounded-[10px] overflow-hidden bg-c-black-10">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px] min-w-[700px]">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="w-[34px] text-start py-2.5 px-3 bg-c-black-12 border-b border-c-black-15">
                                    <button
                                        type="button"
                                        onClick={onToggleAll}
                                        aria-label={allSelected ? "Deselect all on this page" : "Select all on this page"}
                                    >
                                        <Checkbox checked={allSelected} indeterminate={someSelected} />
                                    </button>
                                </th>
                            )}
                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    className={`py-2.5 px-3 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-c-grey-60
                                        bg-c-black-12 border-b border-c-black-15 whitespace-nowrap
                                        ${column.align === "end" ? "text-end" : "text-start"}`}
                                >
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => onSortChange(column.key)}
                                            className="uppercase tracking-[0.06em] hover:text-c-grey-90 duration-150"
                                        >
                                            {column.label}
                                            {sort?.field === column.key && <SortArrow direction={sort.order} />}
                                        </button>
                                    ) : column.label}
                                </th>
                            ))}
                            {rowActions && <th className="w-[92px] bg-c-black-12 border-b border-c-black-15" />}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const id = rowKey(row);
                            const isSelected = selectable && selected?.has(id);

                            return (
                                <tr
                                    key={id}
                                    className={`group border-b border-c-black-15 last:border-b-0 duration-150
                                        ${isSelected ? "bg-c-red-45/[0.07]" : "hover:bg-c-black-12"}`}
                                >
                                    {selectable && (
                                        <td className="py-2.5 px-3">
                                            <button type="button" onClick={() => onToggle(id)} aria-label="Select this row">
                                                <Checkbox checked={isSelected} />
                                            </button>
                                        </td>
                                    )}
                                    {columns.map(column => (
                                        <td
                                            key={column.key}
                                            className={`py-2.5 px-3 text-c-grey-65 align-middle
                                                ${column.align === "end" ? "text-end tabular-nums" : ""}`}
                                        >
                                            {column.render ? column.render(row) : row[column.key] ?? "—"}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="py-2.5 px-3">
                                            {/*//! hidden until the row is hovered or something inside it has
                                                focus, so twenty rows do not present forty buttons at once */}
                                            <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 duration-150">
                                                {rowActions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.total > 0 && (
                <div className="flex items-center gap-2.5 py-2.5 px-3 border-t border-c-black-15 bg-c-black-12 text-[11.5px] text-c-grey-60">
                    <span>
                        Showing <b className="text-c-grey-90">
                            {(pagination.page - 1) * pagination.limit + 1}–
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </b> of {pagination.total.toLocaleString("en-US")}
                    </span>

                    {pagination.totalPages > 1 && (
                        <div className="ms-auto flex gap-1">
                            <PageButton
                                label="‹"
                                disabled={pagination.page === 1}
                                onClick={() => onPageChange(pagination.page - 1)}
                            />
                            {pageWindow(pagination.page, pagination.totalPages).map((entry, index) => (
                                entry === "gap"
                                    ? <span key={`gap-${index}`} className="px-1 text-c-black-30">…</span>
                                    : <PageButton
                                        key={entry}
                                        label={entry}
                                        active={entry === pagination.page}
                                        onClick={() => onPageChange(entry)}
                                    />
                            ))}
                            <PageButton
                                label="›"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => onPageChange(pagination.page + 1)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const PageButton = ({ label, active, disabled, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-current={active ? "page" : undefined}
        className={`min-w-[24px] h-6 px-1.5 rounded-[5px] text-[11.5px] font-bold border duration-150
            ${active
                ? "bg-c-red-45 border-c-red-45 text-white"
                : "bg-c-black-10 border-c-black-20 text-c-grey-65 hover:text-c-grey-90 disabled:opacity-35 disabled:hover:text-c-grey-65"}`}
    >
        {label}
    </button>
);

//! first, last, and a window around the current page — enough to jump about
//! without printing sixty buttons
const pageWindow = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set([1, total, page, page - 1, page + 1]);
    const sorted = [...pages].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);

    return sorted.flatMap((n, i) =>
        i > 0 && n - sorted[i - 1] > 1 ? ["gap", n] : [n]
    );
};

export default DataTable;
