"use client"

import { useEffect } from "react";
import useUserStore from "@/stores/useUserStore";
import Footer from "./footer/Footer";
import Navbar from "./navbar/Navbar";

const MainLayout = ({ children }) => {
    const fetchUser = useUserStore((state) => state.fetchUser);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

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