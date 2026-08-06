"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { logout } from "@/services/UserService";
import useUserStore from "@/stores/useUserStore";
import AdminRail from "./AdminRail";
import CommandPalette from "./CommandPalette";
import { NAV_ITEMS } from "./navigation";

/**
 * The console frame. The rail scrolls independently of the content, so a
 * thousand-row table never takes the navigation off screen with it.
 */
const AdminShell = ({ user, counts, children }) => {
    const router = useRouter();
    const clearUser = useUserStore((state) => state.clearUser);
    const [signingOut, setSigningOut] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);

    //! "g then m" for movies, the way a few tools people already use do it.
    //! The pending g is held for a moment and then forgotten, so a stray g
    //! does not lie in wait to hijack the next key somebody presses.
    const pendingGo = useRef(null);

    useEffect(() => {
        const onKey = (event) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setPaletteOpen(true);
                return;
            }

            //! "/" is the other habit for "search", and worth honouring
            if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
                event.preventDefault();
                setPaletteOpen(true);
                return;
            }

            if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

            if (pendingGo.current) {
                clearTimeout(pendingGo.current);
                pendingGo.current = null;

                const target = NAV_ITEMS.find(item => item.shortcut === event.key.toLowerCase());
                if (target) {
                    event.preventDefault();
                    router.push(target.href);
                }
                return;
            }

            if (event.key.toLowerCase() === "g") {
                pendingGo.current = setTimeout(() => { pendingGo.current = null; }, 1200);
            }
        };

        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            if (pendingGo.current) clearTimeout(pendingGo.current);
        };
    }, [router]);

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
                onOpenPalette={() => setPaletteOpen(true)}
            />
            <div className="flex-1 min-w-0 flex flex-col">{children}</div>

            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}

export default AdminShell;
