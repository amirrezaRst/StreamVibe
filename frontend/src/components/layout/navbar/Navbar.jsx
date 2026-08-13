"use client";

import { useEffect, useRef, useState } from "react";
import { MenuSvg, MultiStar, UserOIcon, UserPlusOIcon } from "@/assets/Svgs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarNav from "./NavbarNav";
import NotificationButton from "./NotificationButton";
import MobileDrawer from "./MobileDrawer";
import useUserStore from "@/stores/useUserStore";
import SearchBox from "@/components/search/SearchBox";
import useScrollDirection from "@/hooks/useScrollDirection";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";


const Navbar = () => {

    const user = useUserStore((state) => state.user);
    const loading = useUserStore((state) => state.loading);
    const pathname = usePathname();
    //! these routes render their own full-bleed auth shell (AuthAside +
    //! form), so the site chrome would just sit on top of it
    const isAuthRoute = pathname === "/register" || pathname.startsWith("/forgot-password");
    const isHome = pathname === "/";

    const { scrolled, hidden } = useScrollDirection();
    const reducedMotion = usePrefersReducedMotion();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef(null);
    const menuButtonRef = useRef(null);

    //! reserves the fixed header's own height in normal flow so page content
    //! doesn't render underneath it. Skipped on home, where the header is
    //! meant to float transparently over the hero instead, exactly like the
    //! old `absolute` positioning did
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    if (isAuthRoute) return null;

    //! home starts transparent so the hero shows through, like the old
    //! `absolute` header; every other route has no hero to float over, so it
    //! carries the solid/blurred chrome from the first frame
    const showChrome = !isHome || scrolled;
    const isHidden = !reducedMotion && hidden && !drawerOpen;

    return (
        <>
            <header
                ref={headerRef}
                className={`fixed top-0 inset-x-0 z-40 py-5 w-full transition-all duration-300 ease-out
                    ${isHidden ? "-translate-y-full" : "translate-y-0"}
                    ${showChrome
                        ? "bg-c-black-08/85 backdrop-blur-md border-b border-c-black-15 shadow-lg shadow-black/20"
                        : "bg-transparent border-b border-transparent"}`}
            >
                <div className="container flex items-center justify-between">
                    <Link href="/">
                        <img src="/images/logo-white.png" alt="StreamVibe" className="3xl:w-full lg:w-[165px] w-[150px]" />
                    </Link>

                    <NavbarNav pathname={pathname} />

                    <div className="flex items-center gap-4">
                        <SearchBox />
                        {loading ? <div className="3xl:w-[5rem] w-[4.1rem] h-1" ></div> : !loading && user ?
                            <>
                                <Link href="/profile" className="relative" aria-label="Your profile">
                                    <UserOIcon className="3xl:w-[2.4rem] 3xl:h-[2.4rem]" aria-hidden="true" />
                                    {user?.subscription?.status == "active" &&
                                        <MultiStar className="absolute -bottom-2.5 -left-2.5 w-[22px] h-[22px]" aria-hidden="true" />
                                    }
                                </Link>
                                <NotificationButton />
                            </> :
                            //! was a <button> inside this <Link> — nested interactive
                            //! elements, and neither carried a name, so the only way
                            //! in for a signed-out visitor announced itself as "link"
                            <Link
                                href="/register?page=login"
                                aria-label="Sign in"
                                className="focus:outline-none focus:border-none mx-2.5 md:inline-flex hidden items-center"
                            >
                                <UserPlusOIcon className="3xl:w-[2.4rem] 3xl:h-[2.4rem]" aria-hidden="true" />
                            </Link>
                        }

                        <button
                            ref={menuButtonRef}
                            type="button"
                            aria-label="Open menu"
                            aria-haspopup="dialog"
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen(true)}
                            className="w-11 h-11 rounded-lg btn-black-10 border border-c-black-15 md:hidden flex justify-center items-center "
                        >
                            <MenuSvg aria-hidden="true" />
                        </button>
                    </div>
                </div>

            </header>

            {!isHome && <div style={{ height: headerHeight }} aria-hidden="true" />}

            <MobileDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                pathname={pathname}
                triggerRef={menuButtonRef}
            />
        </>
    );
}

export default Navbar;