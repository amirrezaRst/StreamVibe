"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { deleteUser, fetchUsers, setUserRole } from "@/services/AdminService";
import useUserStore from "@/stores/useUserStore";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import useListState from "@/components/admin/useListState";
import { EmptyList, SearchField, Segmented, TableButton } from "@/components/admin/ListToolbar";

const initials = (name = "") => name
    .trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

const joined = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

//! Two clicks to make an administrator, and it is the only way short of editing
//! the database. Your own row is inert, because the API refuses it anyway and a
//! button that cannot work should not be offered.
const RoleToggle = ({ role, isYou, busy, onChange }) => (
    <div className="inline-flex bg-c-black-06 border border-c-black-20 rounded-[7px] p-0.5 gap-0.5">
        {["user", "admin"].map(option => (
            <button
                key={option}
                type="button"
                disabled={isYou || busy || role === option}
                onClick={() => onChange(option)}
                aria-pressed={role === option}
                className={`text-[10.5px] font-extrabold py-0.5 px-2.5 rounded-[5px] duration-150
                    ${role === option ? "bg-c-red-45/[0.12] text-c-red-80" : "text-c-black-30"}
                    ${isYou ? "cursor-default" : role !== option ? "hover:text-c-grey-90" : ""}`}
            >
                {option === "user" ? "Member" : "Admin"}
            </button>
        ))}
    </div>
);

const UsersContent = () => {
    const me = useUserStore((state) => state.user);
    const [role, setRole] = useState("all");

    const extraParams = useMemo(() => (role === "all" ? {} : { role }), [role]);
    const list = useListState(fetchUsers, { extraParams });

    const changeRole = (user, next) => {
        list.run(async () => {
            const result = await setUserRole(user._id, next);
            toast.success(result.message);
        }).catch(error => toast.error(error.message));
    };

    const remove = (user) => {
        if (!window.confirm(`Delete ${user.fullName}? Their bookings, reviews and watchlist go with them. This cannot be undone.`)) return;

        list.run(async () => {
            await deleteUser(user._id);
            toast.success(`${user.fullName} deleted`);
        }).catch(error => toast.error(error.message));
    };

    const columns = [
        {
            key: "fullName",
            label: "Member",
            render: (user) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10.5px] font-extrabold text-white
                        bg-gradient-to-br from-c-red-45 to-[#8C0000]">
                        {initials(user.fullName) || "?"}
                    </span>
                    <div className="min-w-0">
                        <p className="text-c-grey-90 font-bold truncate capitalize">
                            {user.fullName}
                            {user._id === me?._id && <span className="text-[10px] text-c-black-30 ms-1.5 normal-case">that is you</span>}
                        </p>
                        <p className="text-[10.5px] text-c-black-30 truncate">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "subscription",
            label: "Plan",
            render: (user) => user.subscription?.status === "active"
                ? <span className="text-[10.5px] font-extrabold py-0.5 px-2 rounded-full bg-c-red-45/[0.12] text-c-red-80 capitalize">
                    {user.subscription.plan}
                </span>
                : <span className="text-[10.5px] font-extrabold py-0.5 px-2 rounded-full bg-c-black-15 text-c-grey-60">Free</span>,
        },
        { key: "joinedAt", label: "Joined", render: (user) => joined(user.joinedAt) },
        {
            key: "role",
            label: "Role",
            render: (user) => (
                <RoleToggle
                    role={user.role}
                    isYou={user._id === me?._id}
                    busy={list.busy}
                    onChange={(next) => changeRole(user, next)}
                />
            ),
        },
    ];

    return (
        <>
            <PageHeader
                crumbs={[{ label: "Community" }]}
                title="Users"
                subtitle={list.pagination
                    ? `${list.pagination.total.toLocaleString("en-US")} accounts`
                    : "Loading accounts"}
            />

            <div className="p-[18px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <Segmented
                        value={role}
                        onChange={setRole}
                        options={[
                            { id: "all", label: "Everyone" },
                            { id: "user", label: "Members" },
                            { id: "admin", label: "Administrators" },
                        ]}
                    />
                    <SearchField value={list.search} onChange={list.setSearch} placeholder="Search name or email" />
                </div>

                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    selectable={false}
                    pagination={list.pagination}
                    onPageChange={list.setPage}
                    rowActions={(user) => (
                        user._id === me?._id
                            ? null
                            : <TableButton tone="danger" onClick={() => remove(user)} disabled={list.busy}>Delete</TableButton>
                    )}
                    empty={
                        <EmptyList
                            searching={!!list.search}
                            term={list.search}
                            onClear={() => list.setSearch("")}
                            title="Nobody here"
                            description="No accounts match this filter."
                        />
                    }
                />
            </div>
        </>
    );
}

export default UsersContent;
