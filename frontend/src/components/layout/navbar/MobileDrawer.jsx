"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
    BellSvg,
    CategoryIcon,
    CirclePlayIcon,
    EnvelopeIcon,
    EpisodeIcon,
    HomeIcon,
    LeftArrowSvg,
    MultiStar,
    SearchSvg,
    SignOutIcon,
    UserOIcon,
    UserPlusOIcon,
    XmarkIcon,
} from "@/assets/Svgs";
import SearchContainer from "@/components/search/SearchContainer";
import NotificationList from "@/components/notification/NotificationList";
import useUserStore from "@/stores/useUserStore";
import useNotificationStore from "@/stores/useNotificationStore";
import { logout } from "@/services/UserService";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const NAV_LINKS = [
    { href: "/", label: "Home", icon: HomeIcon, exact: true },
    { href: "/explore", label: "Explore", icon: CategoryIcon },
    { href: "/movies", label: "Movies", icon: CirclePlayIcon },
    { href: "/series", label: "Series", icon: EpisodeIcon },
    { href: "/subscriptions", label: "Subscriptions", icon: MultiStar },
    { href: "/support", label: "Support", icon: EnvelopeIcon },
];

//! two letters is enough to recognise your own account at a glance — matches
//! the initials treatment already used in ProfileSidebar
const initials = (name = "") => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const MobileDrawer = ({ isOpen, onClose, pathname, triggerRef }) => {
    const [show, setShow] = useState(isOpen);
    //! the panel mounts (`show`) already sitting at translate-x-0/opacity-100
    //! if that's the class it's born with — a CSS transition needs two
    //! distinct painted frames to interpolate between, so opening it snapped
    //! into place instead of sliding. `entered` starts false on the same
    //! render that mounts the panel, then flips true a frame later, giving
    //! the browser a "closed" frame to animate away from
    const [entered, setEntered] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [notifView, setNotifView] = useState(false);
    const closeButtonRef = useRef(null);
    const router = useRouter();
    const reducedMotion = usePrefersReducedMotion();

    const user = useUserStore((state) => state.user);
    const loading = useUserStore((state) => state.loading);
    const clearUser = useUserStore((state) => state.clearUser);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const markAllRead = useNotificationStore((state) => state.markAllRead);

    //! reset to the main menu only once the panel is off-screen (`show`
    //! false), not the instant `isOpen` flips — otherwise re-opening later
    //! would flash back to the menu while still visibly sliding shut
    useEffect(() => {
        if (!show) setNotifView(false);
    }, [show]);

    //! kept mounted through the close transition (matches SearchOverlay's own
    //! show/isOpen split) so the panel can slide back out instead of vanishing
    useEffect(() => {
        if (isOpen) {
            setShow(true);
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = "11px";
        } else {
            setEntered(false);
            document.body.style.overflow = "auto";
            document.body.style.paddingRight = "0";
            const timeout = setTimeout(() => setShow(false), reducedMotion ? 0 : 400);
            return () => clearTimeout(timeout);
        }
    }, [isOpen, reducedMotion]);

    //! a single requestAnimationFrame sometimes lands in the same paint as
    //! the mount on Chrome; nesting a second one guarantees the "closed"
    //! frame has actually painted before flipping to the open state
    useEffect(() => {
        if (!show) return;
        if (reducedMotion) {
            setEntered(true);
            return;
        }
        let raf2;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setEntered(true));
        });
        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [show, reducedMotion]);

    //! separate from the effect above on purpose — `show` flips true on the
    //! render that mounts the dialog, one render after `isOpen` does, so the
    //! close button's ref isn't attached yet if this runs off `isOpen` alone
    useEffect(() => {
        if (isOpen && show) closeButtonRef.current?.focus();
    }, [isOpen, show]);

    const handleClose = () => {
        onClose();
        triggerRef?.current?.focus();
    };

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, handleClose]);

    //! closes the drawer first rather than layering the search overlay on
    //! top of it — both lock body scroll independently, and running them
    //! at once means whichever closes first wins the fight over overflow
    const handleSearchClick = () => {
        onClose();
        setTimeout(() => setSearchOpen(true), reducedMotion ? 0 : 400);
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await logout();
            clearUser();
            handleClose();
            router.push("/");
            toast.success("You have been signed out.");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSigningOut(false);
        }
    };

    if (!show) return <SearchContainer isOpen={searchOpen} setIsOpen={setSearchOpen} />;

    return (
        <>
            <div
                className={`fixed inset-0 z-[45] md:hidden ${reducedMotion ? "" : "transition-opacity duration-300 ease-out"} ${entered ? "opacity-100" : "opacity-0"}`}
            >
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={handleClose}
                    aria-hidden="true"
                />

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site menu"
                    className={`absolute top-0 right-0 h-full w-[86%] max-w-[360px] bg-c-black-08 border-l border-c-black-15
                        shadow-2xl shadow-black/50 flex flex-col ${reducedMotion ? "" : "transition-transform duration-400 ease-out"}
                        ${entered ? "translate-x-0" : "translate-x-full"}`}
                >
                    <div className="flex items-center justify-between px-5 py-5 border-b border-c-black-15 shrink-0">
                        {notifView ? (
                            <>
                                <button
                                    type="button"
                                    aria-label="Back to menu"
                                    onClick={() => setNotifView(false)}
                                    className="w-9 h-9 rounded-lg btn-black-10 border border-c-black-15 flex items-center justify-center shrink-0"
                                >
                                    <LeftArrowSvg className="w-3.5 h-3.5 stroke-current" aria-hidden="true" />
                                </button>
                                <h2 className="text-white font-extrabold text-[15px] flex-1 text-center">Notifications</h2>
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={unreadCount === 0}
                                    className="text-c-red-60 disabled:text-c-grey-55 disabled:opacity-60 text-xs font-bold shrink-0 disabled:cursor-default"
                                >
                                    Mark all
                                </button>
                            </>
                        ) : (
                            <>
                                <img src="/images/logo-white.png" alt="StreamVibe" className="w-[130px]" />
                                <button
                                    ref={closeButtonRef}
                                    type="button"
                                    aria-label="Close menu"
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-lg btn-black-10 border border-c-black-15 flex items-center justify-center"
                                >
                                    <XmarkIcon aria-hidden="true" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                    <div className={`absolute inset-0 overflow-y-auto custom-scrollbar custom-scrollbar-sm px-5 py-6 flex flex-col gap-6
                        ${reducedMotion ? "" : "transition-[transform,opacity] duration-300 ease-out"}
                        ${notifView ? "-translate-x-[30%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
                        <button
                            type="button"
                            onClick={handleSearchClick}
                            className="flex items-center gap-3 text-c-grey-75 py-3 px-3.5 rounded-lg btn-black-10 border border-c-black-15"
                        >
                            <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
                                <SearchSvg aria-hidden="true" />
                            </span>
                            <span className="text-sm font-medium">Search movies &amp; shows</span>
                        </button>

                        <nav aria-label="Primary">
                            <ul className="flex flex-col gap-1">
                                {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
                                    const active = exact ? pathname === href : pathname.startsWith(href);
                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                onClick={handleClose}
                                                aria-current={active ? "page" : undefined}
                                                className={`flex items-center gap-3 py-3 px-3.5 rounded-lg text-sm font-medium transition-colors
                                                    ${active ? "bg-c-black-15 text-white" : "text-c-grey-75 hover:bg-c-black-10"}`}
                                            >
                                                <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
                                                    <Icon aria-hidden="true" />
                                                </span>
                                                {label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className="mt-auto pt-6 border-t border-c-black-15">
                            {loading ? (
                                <div className="h-12" />
                            ) : user ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-3 px-3.5 pb-3">
                                        <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-extrabold text-white bg-gradient-to-br from-c-red-45 to-[#8C0000]">
                                            {initials(user?.fullName) || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{user?.fullName}</div>
                                            {user?.subscription?.status === "active" ? (
                                                <span className="text-[11px] font-bold text-c-red-80 capitalize">★ {user.subscription.plan}</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-c-grey-60">Free account</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifView(true)}
                                        className="flex items-center gap-3 py-3 px-3.5 rounded-lg text-c-grey-75 hover:bg-c-black-10 text-sm font-medium text-left"
                                    >
                                        <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                                            <BellSvg aria-hidden="true" />
                                        </span>
                                        <span className="flex-1">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-[5px] rounded-full bg-c-red-45 text-white text-[10.5px] font-extrabold flex items-center justify-center [font-variant-numeric:tabular-nums]">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <Link
                                        href="/profile"
                                        onClick={handleClose}
                                        className="flex items-center gap-3 py-3 px-3.5 rounded-lg text-c-grey-75 hover:bg-c-black-10 text-sm font-medium"
                                    >
                                        <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
                                            <UserOIcon aria-hidden="true" />
                                        </span>
                                        My Profile
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        disabled={signingOut}
                                        className="flex items-center gap-3 py-3 px-3.5 rounded-lg text-c-grey-75 hover:bg-c-black-10 text-sm font-medium disabled:opacity-60 text-left"
                                    >
                                        <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
                                            <SignOutIcon aria-hidden="true" />
                                        </span>
                                        {signingOut ? "Signing out…" : "Sign Out"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    <Link
                                        href="/register?page=login"
                                        onClick={handleClose}
                                        className="flex items-center justify-center gap-2 py-3 rounded-lg bg-c-red-45 text-white text-sm font-semibold"
                                    >
                                        <span className="w-5 h-5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
                                            <UserPlusOIcon aria-hidden="true" />
                                        </span>
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={handleClose}
                                        className="flex items-center justify-center py-3 rounded-lg btn-black-10 border border-c-black-15 text-c-grey-75 text-sm font-semibold"
                                    >
                                        Create Account
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`absolute inset-0 overflow-y-auto custom-scrollbar custom-scrollbar-sm
                        ${reducedMotion ? "" : "transition-[transform,opacity] duration-300 ease-out"}
                        ${notifView ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
                    >
                        <NotificationList onNavigate={handleClose} />
                    </div>
                    </div>
                </div>
            </div>

            <SearchContainer isOpen={searchOpen} setIsOpen={setSearchOpen} />
        </>
    );
};

export default MobileDrawer;
