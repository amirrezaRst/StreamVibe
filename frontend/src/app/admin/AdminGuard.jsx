"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import useUserStore from "@/stores/useUserStore";
import AdminShell from "@/components/admin/AdminShell";

/**
 * The console is gated on the server too — every /admin endpoint refuses a
 * non-admin. This is only so nobody stares at a shell full of empty panels
 * wondering what broke.
 */
const AdminGuard = ({ children }) => {
    const router = useRouter();
    const user = useUserStore((state) => state.user);
    const loading = useUserStore((state) => state.loading);

    const allowed = user && user.role === "admin";

    useEffect(() => {
        if (loading) return;

        if (!user) router.replace("/register?page=login");
        else if (user.role !== "admin") router.replace("/");
    }, [loading, user, router]);

    if (loading || !allowed) {
        return (
            <div className="min-h-screen bg-c-black-06 flex items-center justify-center">
                <p className="text-c-grey-60 text-super-sm">
                    {loading ? "Checking your access…" : "Redirecting…"}
                </p>
            </div>
        );
    }

    return <AdminShell user={user}>{children}</AdminShell>;
}

export default AdminGuard;
