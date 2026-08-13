"use client";

import { useCallback } from "react";
import Link from "next/link";
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

const FilesPill = ({ count }) => (
    <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-full whitespace-nowrap
        ${count > 0 ? "bg-[#3DA872]/[0.14] text-[#6FCB9C]" : "bg-[#D99A34]/[0.14] text-[#E8B663]"}`}
    >
        {count > 0 ? (count === 1 ? "1 quality" : `${count} qualities`) : "No files"}
    </span>
);

const linkButton = "rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border border-c-black-20 bg-c-black-12 text-c-grey-65 hover:text-c-grey-90 duration-150";

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
        //! surfaces what used to be invisible: an empty `files` array on a
        //! movie looked identical to one with real download files. Series
        //! don't get this column — their files live per-episode, one level
        //! down, where the series workspace page already shows them.
        ...(series ? [] : [{ key: "files", label: "Files", render: (row) => <FilesPill count={row.fileCount || 0} /> }]),
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
            >
                <Link
                    href={series ? "/admin/series/new" : "/admin/movies/new"}
                    className="rounded-[7px] py-[7px] px-3.5 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                        text-white hover:bg-c-red-45/85 duration-150"
                >
                    + New {series ? "series" : "movie"}
                </Link>
            </PageHeader>

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <SearchField
                        value={list.search}
                        onChange={list.setSearch}
                        placeholder={`Search ${series ? "series" : "movies"}`}
                    />
                    {list.sort && (
                        <span className="text-[11px] text-c-grey-55">
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
                        <div className="flex items-center gap-1.5 justify-end">
                            <Link href={series ? `/admin/series/${row._id}` : `/admin/movies/${row._id}/edit`} className={linkButton}>
                                Edit
                            </Link>
                            <TableButton tone="danger" onClick={() => remove(row)} disabled={list.busy}>
                                Delete
                            </TableButton>
                        </div>
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
