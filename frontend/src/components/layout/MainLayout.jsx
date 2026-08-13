"use client"

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import useUserStore from "@/stores/useUserStore";
import useNotificationStore from "@/stores/useNotificationStore";
import Footer from "./footer/Footer";
import Navbar from "./navbar/Navbar";

const MainLayout = ({ children }) => {
    const fetchUser = useUserStore((state) => state.fetchUser);
    const user = useUserStore((state) => state.user);
    const fetchNotifications = useNotificationStore((state) => state.fetchAll);
    const clearNotifications = useNotificationStore((state) => state.clearNotifications);
    const pathname = usePathname();

    //! the console brings its own rail and header, and a marketing footer under
    //! a data table would be nonsense
    const isConsole = pathname.startsWith("/admin");

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    //! notifications are user-scoped, so they only exist to fetch once we know
    //! who's signed in, and have to be dropped again on sign-out — otherwise
    //! the previous account's list would flash on a shared browser
    useEffect(() => {
        if (user) fetchNotifications();
        else clearNotifications();
    }, [user, fetchNotifications, clearNotifications]);

    if (isConsole) return children;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-c-black-08 -z-40">
                {children}
            </div>
            <Footer />
        </>
    );
}

export default MainLayout;