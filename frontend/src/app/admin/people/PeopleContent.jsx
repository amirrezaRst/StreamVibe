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

    const removeOne = (person) => {
        //! the credit counts are exactly what makes this answerable — deleting
        //! somebody attached to fourteen films is not the same decision
        const credits = person.movies + person.series;
        const warning = credits
            ? `${person.fullName} is credited on ${credits} title${credits === 1 ? "" : "s"}. Deleting them leaves those credits empty.`
            : `${person.fullName} is credited on nothing.`;

        if (!window.confirm(`${warning}\n\nDelete them? This cannot be undone.`)) return;

        list.run(async () => {
            await remove(person._id);
            toast.success(`${person.fullName} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const removeSelected = () => {
        const ids = [...list.selected];
        if (!window.confirm(`Delete ${ids.length} ${label}${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

        list.run(async () => {
            for (const id of ids) {
                await remove(id);
            }
            toast.success(`${ids.length} deleted`);
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
