"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";

import { deleteMovie, deleteSeries, fetchCatalogue } from "@/services/AdminService";
import DataTable from "@/components/admin/DataTable";
import MediaCell from "@/components/admin/MediaCell";
import PageHeader from "@/components/admin/PageHeader";
import useListState from "@/components/admin/useListState";
import { BulkBar, EmptyList, SearchField, TableButton } from "@/components/admin/ListToolbar";

const number = (value) => (value ?? 0).toLocaleString("en-US");

//! category is an array on both models, and React renders an array of strings
//! by concatenating them — "drama" and "crime" arrive as "dramacrime"
const joined = (value) => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    return value || "—";
};

/**
 * Movies and series are the same table with one column swapped — runtime for
 * one, season count for the other — so they share this. `kind` picks which.
 */
const CatalogueContent = ({ kind }) => {
    const series = kind === "series";

    const loader = useCallback((params) => fetchCatalogue(series ? "series" : "movies", params), [series]);
    const list = useListState(loader, { initialSort: { field: "createdAt", order: "desc" } });

    const remove = (row) => {
        if (!window.confirm(`Delete “${row.title}”? Its reviews go with it, and any scheduled showtimes are cancelled. This cannot be undone.`)) return;

        list.run(async () => {
            await (series ? deleteSeries(row._id) : deleteMovie(row._id));
            toast.success(`“${row.title}” deleted`);
        }).catch(error => toast.error(error.message));
    };

    const removeSelected = () => {
        const ids = [...list.selected];
        if (!window.confirm(`Delete ${ids.length} title${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

        list.run(async () => {
            //! no bulk delete endpoint exists, and inventing one for a
            //! destructive action deserves more thought than a loop does
            for (const id of ids) {
                await (series ? deleteSeries(id) : deleteMovie(id));
            }
            toast.success(`${ids.length} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const columns = [
        {
            key: "title",
            label: "Title",
            sortable: true,
            render: (row) => (
                <MediaCell
                    image={row.thumbnail}
                    title={row.title}
                    subtitle={[joined(row.country), joined(row.language)].filter(v => v !== "—").join(" · ")}
                />
            ),
        },
        { key: "category", label: "Category", render: (row) => <span className="capitalize">{joined(row.category)}</span> },
        series
            ? { key: "seasons", label: "Seasons", align: "end", render: (row) => number(row.seasons) }
            : { key: "duration", label: "Runtime", align: "end", render: (row) => (row.duration ? `${row.duration}m` : "—") },
        { key: "views", label: "Views", align: "end", sortable: true, render: (row) => number(row.views) },
        {
            key: "rate",
            label: "Rating",
            align: "end",
            sortable: true,
            render: (row) => (
                <span title={`${row.reviewCount || 0} review${row.reviewCount === 1 ? "" : "s"}`}>
                    {row.rate ? row.rate.toFixed(1) : "—"}
                </span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Catalog" }]}
                title={series ? "Series" : "Movies"}
                subtitle={list.pagination
                    ? `${number(list.pagination.total)} ${series ? "series" : "titles"} in the catalog`
                    : "Loading the catalog"}
            />

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <SearchField
                        value={list.search}
                        onChange={list.setSearch}
                        placeholder={`Search ${series ? "series" : "movies"}`}
                    />
                    {list.sort && (
                        <span className="text-[11px] text-c-black-30">
                            Sorted by <b className="text-c-grey-65 capitalize">{list.sort.field === "createdAt" ? "newest" : list.sort.field}</b>
                        </span>
                    )}
                </div>

                {list.selected.size > 0 && (
                    <BulkBar count={list.selected.size} onClear={list.clearSelection}>
                        <TableButton tone="danger" onClick={removeSelected} disabled={list.busy}>
                            Delete {list.selected.size}
                        </TableButton>
                    </BulkBar>
                )}

                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    sort={list.sort}
                    onSortChange={list.changeSort}
                    selected={list.selected}
                    onToggle={list.toggle}
                    onToggleAll={list.toggleAll}
                    pagination={list.pagination}
                    onPageChange={list.setPage}
                    rowActions={(row) => (
                        <TableButton tone="danger" onClick={() => remove(row)} disabled={list.busy}>
                            Delete
                        </TableButton>
                    )}
                    empty={
                        <EmptyList
                            searching={!!list.search}
                            term={list.search}
                            onClear={() => list.setSearch("")}
                            title={`No ${series ? "series" : "movies"} yet`}
                            description="Add the first one and it will show up here."
                        />
                    }
                />
            </div>
        </>
    );
}

export default CatalogueContent;
