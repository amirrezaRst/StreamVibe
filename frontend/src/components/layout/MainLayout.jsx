"use client"

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import useUserStore from "@/stores/useUserStore";
import Footer from "./footer/Footer";
import Navbar from "./navbar/Navbar";

const MainLayout = ({ children }) => {
    const fetchUser = useUserStore((state) => state.fetchUser);
    const pathname = usePathname();

    //! the console brings its own rail and header, and a marketing footer under
    //! a data table would be nonsense
    const isConsole = pathname.startsWith("/admin");

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

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