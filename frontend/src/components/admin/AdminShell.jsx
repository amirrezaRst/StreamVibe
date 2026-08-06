"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { logout } from "@/services/UserService";
import useUserStore from "@/stores/useUserStore";
import AdminRail from "./AdminRail";

/**
 * The console frame. The rail scrolls independently of the content, so a
 * thousand-row table never takes the navigation off screen with it.
 */
const AdminShell = ({ user, counts, children }) => {
    const router = useRouter();
    const clearUser = useUserStore((state) => state.clearUser);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await logout();
            clearUser();
            router.push("/");
        } catch (error) {
            toast.error(error.message);
            setSigningOut(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-c-black-06 text-c-grey-97">
            <AdminRail
                user={user}
                counts={counts}
                onSignOut={handleSignOut}
                signingOut={signingOut}
            />
            <div className="flex-1 min-w-0 flex flex-col">{children}</div>
        </div>
    );
}

export default AdminShell;
