"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { deleteActor, deleteDirector, fetchPeople } from "@/services/AdminService";
import DataTable from "@/components/admin/DataTable";
import MediaCell from "@/components/admin/MediaCell";
import PageHeader from "@/components/admin/PageHeader";
import useListState from "@/components/admin/useListState";
import { BulkBar, EmptyList, SearchField, Segmented, TableButton } from "@/components/admin/ListToolbar";

const PeopleContent = () => {
    //! actors and directors are the same job wearing two collections; one
    //! section with a switch rather than two rail entries competing for
    //! attention over a distinction nobody navigates by
    const [kind, setKind] = useState("actors");
    const directors = kind === "directors";

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
            await (directors ? deleteDirector(person._id) : deleteActor(person._id));
            toast.success(`${person.fullName} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const removeSelected = () => {
        const ids = [...list.selected];
        if (!window.confirm(`Delete ${ids.length} ${directors ? "director" : "actor"}${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

        list.run(async () => {
            for (const id of ids) {
                await (directors ? deleteDirector(id) : deleteActor(id));
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
                    ? `${list.pagination.total.toLocaleString("en-US")} ${kind} on record`
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
                        ]}
                    />
                    <SearchField value={list.search} onChange={list.setSearch} placeholder="Search by name" />
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
                        <TableButton tone="danger" onClick={() => removeOne(person)} disabled={list.busy}>
                            Delete
                        </TableButton>
                    )}
                    empty={
                        <EmptyList
                            searching={!!list.search}
                            term={list.search}
                            onClear={() => list.setSearch("")}
                            title={`No ${kind} yet`}
                            description="Add someone and they will show up here, along with what they are credited on."
                        />
                    }
                />
            </div>
        </>
    );
}

export default PeopleContent;
