"use client";

import { useEffect, useRef } from "react";
import { BookmarkIcon, EnvelopeIcon, HeartIcon, SeatGridIcon, SignOutIcon, UserCircleIcon } from "@/assets/Svgs";

export const PROFILE_TABS = [
    {
        label: "Account",
        items: [{ id: "account", label: "Account Info", icon: UserCircleIcon }],
    },
    {
        label: "Library",
        items: [
            { id: "watchlist", label: "Watchlist", icon: BookmarkIcon, count: "watchList" },
            { id: "liked", label: "Liked", icon: HeartIcon, count: "likes" },
        ],
    },
    {
        label: "Cinema",
        items: [{ id: "bookings", label: "My Bookings", icon: SeatGridIcon, count: "bookings" }],
    },
    {
        label: "Support",
        items: [{ id: "tickets", label: "My Tickets", icon: EnvelopeIcon, count: "tickets" }],
    },
];

//! two letters is enough to recognise your own account at a glance, and it
//! degrades gracefully for single-word names
const initials = (name = "") => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();

const ProfileSidebar = ({ user, counts, activeTab, onSelect, onSignOut, signingOut }) => {
    const activeRef = useRef(null);

    //! on narrow screens the tabs are a scrolling strip, so the selected one
    //! can sit off-screen after a deep link or a refresh
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [activeTab]);

    return (
    <aside className="lg:w-[272px] w-full shrink-0 lg:sticky lg:top-6 bg-c-black-10 border border-c-black-15 rounded-2xl lg:p-[22px] p-3.5">
        <div className="flex items-center gap-3 pb-[18px] mb-3.5 border-b border-c-black-15">
            <div className="w-[46px] h-[46px] rounded-full shrink-0 flex items-center justify-center text-base font-extrabold text-white bg-gradient-to-br from-c-red-45 to-[#8C0000] shadow-[0_6px_16px_-6px_rgba(229,0,0,0.55)]">
                {initials(user?.fullName) || "?"}
            </div>
            <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-white truncate">{user?.fullName}</div>
                {user?.subscription?.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-c-red-80 bg-c-red-45/[0.12] py-0.5 px-2 rounded-full mt-1 capitalize">
                        ★ {user.subscription.plan}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-c-grey-60 bg-c-black-15 py-0.5 px-2 rounded-full mt-1">
                        Free account
                    </span>
                )}
            </div>
        </div>

        {/*//! below lg the whole nav collapses into one horizontally scrollable
            strip of pills, so the panel itself keeps the full width */}
        <div className="flex lg:block gap-2 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PROFILE_TABS.map(group => (
                <div key={group.label} className="lg:mb-1 shrink-0">
                    <div className="hidden lg:block text-[10.5px] font-bold uppercase tracking-[0.07em] text-c-black-30 pt-3.5 pb-1.5 px-2.5">
                        {group.label}
                    </div>
                    <ul className="flex lg:flex-col gap-2 lg:gap-0.5 list-none m-0 p-0">
                        {group.items.map(({ id, label, icon: Icon, count }) => {
                            const active = activeTab === id;

                            return (
                                <li key={id}>
                                    <button
                                        type="button"
                                        ref={active ? activeRef : null}
                                        onClick={() => onSelect(id)}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-[11px] w-full lg:w-full shrink-0 text-sm font-semibold text-start duration-150
                                            lg:rounded-[9px] lg:py-2.5 lg:px-2.5 lg:border-0 lg:border-s-[2.5px]
                                            rounded-full py-2.5 px-4 border whitespace-nowrap
                                            ${active
                                                ? "bg-c-black-12 text-white lg:border-s-c-red-45 border-c-red-45 max-lg:bg-c-red-45/[0.12]"
                                                : "lg:border-s-transparent border-c-black-15 text-c-grey-65 hover:bg-c-black-12 hover:text-c-grey-90"
                                            }`}
                                    >
                                        <Icon className={`w-[17px] h-[17px] shrink-0 duration-150 ${active ? "text-c-red-60" : "opacity-80"}`} />
                                        <span className="flex-1 min-w-0">{label}</span>
                                        {count && counts?.[count] > 0 && (
                                            <span className={`text-[11px] font-bold rounded-full py-px px-2 tabular-nums
                                                ${active ? "bg-c-red-45/[0.12] text-c-red-80" : "bg-c-black-15 text-c-grey-65"}`}
                                            >
                                                {counts[count]}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>

        <div className="mt-4 pt-3.5 border-t border-c-black-15">
            <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="flex items-center gap-[11px] w-full py-2.5 px-2.5 rounded-[9px] text-sm font-semibold text-start
                    text-c-grey-65 duration-150 hover:bg-c-red-45/[0.12] hover:text-[#FF8A8A] disabled:opacity-50"
            >
                <SignOutIcon className="w-[17px] h-[17px] shrink-0" />
                {signingOut ? "Signing out…" : "Log Out"}
            </button>
        </div>
    </aside>
    );
}

export default ProfileSidebar;
