"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { deleteActor, deleteDirector, deleteMusician, fetchPeople } from "@/services/AdminService";
import DataTable from "@/components/admin/DataTable";
import MediaCell from "@/components/admin/MediaCell";
import PageHeader from "@/components/admin/PageHeader";
import PersonDrawer from "@/components/admin/PersonDrawer";
import useListState from "@/components/admin/useListState";
import { BulkBar, EmptyList, SearchField, Segmented, TableButton } from "@/components/admin/ListToolbar";

//! the singular each kind is called in a sentence, and how to delete one —
//! three collections, one section, since they are the same job and nobody
//! navigates by which collection a credit happens to live in
const KINDS = {
    actors: { label: "actor", remove: deleteActor },
    directors: { label: "director", remove: deleteDirector },
    musicians: { label: "composer", remove: deleteMusician },
};

const PeopleContent = () => {
    const [kind, setKind] = useState("actors");
    const { label, remove } = KINDS[kind];

    //! `undefined` = closed, `null` = open in create mode, an object = open
    //! editing that row — three states, one piece of state
    const [drawer, setDrawer] = useState(undefined);

    const extraParams = useMemo(() => ({ kind }), [kind]);
    const list = useListState(fetchPeople, { extraParams });

    //! the server refuses to delete anyone still attached to a title, so a
    //! credited row says so up front instead of offering a confirm that is
    //! only going to come back as an error
    const removeOne = (person) => {
        const credits = person.movies + person.series;

        if (credits) {
            toast.error(`${person.fullName} is credited on ${credits} title${credits === 1 ? "" : "s"}. Remove them from those titles first.`);
            return;
        }

        if (!window.confirm(`${person.fullName} is credited on nothing.\n\nDelete them? This cannot be undone.`)) return;

        list.run(async () => {
            await remove(person._id);
            toast.success(`${person.fullName} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const removeSelected = () => {
        const rows = list.rows.filter(row => list.selected.has(row._id));
        const credited = rows.filter(row => row.movies + row.series > 0);
        const free = rows.filter(row => row.movies + row.series === 0);

        if (!free.length) {
            toast.error(`All ${credited.length} selected ${credited.length === 1 ? label : `${label}s`} are still credited on titles.`);
            return;
        }

        //! says exactly what it is about to do and what it is skipping —
        //! silently deleting a subset of a selection is worse than refusing
        const skipping = credited.length
            ? `\n\n${credited.length} of them ${credited.length === 1 ? "is" : "are"} still credited and will be skipped.`
            : "";

        if (!window.confirm(`Delete ${free.length} ${free.length === 1 ? label : `${label}s`}?${skipping}\n\nThis cannot be undone.`)) return;

        list.run(async () => {
            for (const row of free) {
                await remove(row._id);
            }
            toast.success(`${free.length} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const columns = [
        {
            key: "fullName",
            label: "Name",
            render: (person) => (
                <MediaCell rounded image={person.profile} title={person.fullName} subtitle={person.gender} />
            ),
        },
        { key: "country", label: "Country", render: (person) => person.country || "—" },
        { key: "movies", label: "Movies", align: "end" },
        { key: "series", label: "Series", align: "end" },
    ];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Catalog" }]}
                title="People"
                subtitle={list.pagination
                    ? `${list.pagination.total.toLocaleString("en-US")} ${label}${list.pagination.total === 1 ? "" : "s"} on record`
                    : "Loading"}
            />

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <Segmented
                        value={kind}
                        onChange={setKind}
                        options={[
                            { id: "actors", label: "Actors" },
                            { id: "directors", label: "Directors" },
                            { id: "musicians", label: "Composers" },
                        ]}
                    />
                    <SearchField value={list.search} onChange={list.setSearch} placeholder="Search by name" />
                    <span className="flex-1" />
                    <button
                        type="button"
                        onClick={() => setDrawer(null)}
                        className="rounded-[7px] py-[7px] px-3.5 text-[12.5px] font-bold bg-c-red-45 border border-c-red-45
                            text-white hover:bg-c-red-45/85 duration-150"
                    >
                        + Add {label}
                    </button>
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
                    selected={list.selected}
                    onToggle={list.toggle}
                    onToggleAll={list.toggleAll}
                    pagination={list.pagination}
                    onPageChange={list.setPage}
                    rowActions={(person) => (
                        <div className="flex items-center gap-1.5 justify-end">
                            <TableButton onClick={() => setDrawer(person)}>Edit</TableButton>
                            <TableButton tone="danger" onClick={() => removeOne(person)} disabled={list.busy}>
                                Delete
                            </TableButton>
                        </div>
                    )}
                    empty={
                        <EmptyList
                            searching={!!list.search}
                            term={list.search}
                            onClear={() => list.setSearch("")}
                            title={`No ${label}s yet`}
                            description="Add someone and they will show up here, along with what they are credited on."
                        />
                    }
                />
            </div>

            {drawer !== undefined && (
                <PersonDrawer
                    kind={kind}
                    person={drawer}
                    onClose={() => setDrawer(undefined)}
                    onSaved={() => { setDrawer(undefined); list.refresh(); }}
                />
            )}
        </>
    );
}

export default PeopleContent;
