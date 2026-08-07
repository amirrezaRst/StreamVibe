"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutIcon } from "@/assets/Svgs";
import { ExternalIcon, SearchIcon } from "./AdminIcons";
import { NAV_GROUPS, isActive } from "./navigation";

const initials = (name = "") => name
    .trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

const AdminRail = ({ user, counts, onSignOut, signingOut, onNavigate, onOpenPalette }) => {
    const pathname = usePathname();

    return (
        <aside className="w-[212px] shrink-0 bg-[#121212] border-e border-c-black-15 px-2.5 py-3.5 flex flex-col h-screen sticky top-0 overflow-y-auto">
            {/*//! the real lockup, the same file the public navbar loads.
                "Console" sits beside it rather than being worked into the logo,
                so the brand mark itself is never altered */}
            <Link href="/" className="flex items-center gap-2 px-1.5 pt-1 pb-3 mb-1.5 border-b border-c-black-15">
                <img src="/images/logo-white.png" alt="StreamVibe" className="w-[104px] h-auto block shrink-0" />
                <span className="text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-c-grey-60 bg-c-black-12 border border-c-black-20 rounded px-[5px] py-0.5 whitespace-nowrap">
                    Console
                </span>
            </Link>

            {/*//! a shortcut nobody can discover does not exist, so the rail
                carries the same thing as a button with its keys printed on it */}
            <button
                type="button"
                onClick={onOpenPalette}
                className="flex items-center gap-2 w-full mt-2.5 mb-1 py-[7px] px-2.5 rounded-[7px]
                    bg-c-black-06 border border-c-black-15 text-c-grey-55 hover:text-c-grey-65
                    hover:border-c-black-20 duration-150 text-[11.5px]"
            >
                <SearchIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-start">Search</span>
                <kbd className="text-[9.5px] font-extrabold bg-c-black-12 border border-c-black-20 rounded px-1.5">
                    ⌘K
                </kbd>
            </button>

            <nav className="flex-1">
                {NAV_GROUPS.map(group => (
                    <div key={group.label} className="mt-3">
                        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-c-grey-55 px-2.5 pb-1.5">
                            {group.label}
                        </p>
                        <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
                            {group.items.map(item => {
                                const active = isActive(item, pathname);
                                const Icon = item.icon;
                                const count = counts?.[item.id];

                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center gap-2.5 w-full py-[7px] px-2.5 rounded-[7px] text-[12.5px] font-semibold
                                                border-s-2 duration-150
                                                ${active
                                                    ? "bg-c-black-12 text-white border-s-c-red-45"
                                                    : "border-s-transparent text-c-grey-65 hover:bg-c-black-10 hover:text-c-grey-90"
                                                }`}
                                        >
                                            <Icon className={`w-[15px] h-[15px] shrink-0 ${active ? "text-c-red-60" : "opacity-75"}`} />
                                            <span className="flex-1">{item.label}</span>
                                            {count > 0 && (
                                                <span className="text-[10px] font-extrabold bg-c-red-45/[0.12] text-c-red-80 rounded-full px-1.5 tabular-nums">
                                                    {count}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="mt-auto pt-3 border-t border-c-black-15">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 w-full py-[7px] px-2.5 rounded-[7px] text-[12px] font-semibold
                        text-c-grey-65 hover:bg-c-black-10 hover:text-c-grey-90 duration-150 mb-1"
                >
                    <ExternalIcon className="w-[15px] h-[15px] shrink-0 opacity-75" />
                    View the site
                </Link>

                <div className="flex items-center gap-2.5 px-1.5 py-2">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-c-red-45 to-[#8C0000] flex items-center justify-center text-[11px] font-extrabold shrink-0">
                        {initials(user?.fullName) || "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold truncate">{user?.fullName}</span>
                        <span className="block text-[10px] text-c-grey-55">Administrator</span>
                    </span>
                    <button
                        type="button"
                        onClick={onSignOut}
                        disabled={signingOut}
                        aria-label="Sign out"
                        title="Sign out"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-c-grey-60
                            hover:bg-c-red-45/[0.12] hover:text-[#FF8A8A] duration-150 disabled:opacity-50"
                    >
                        <SignOutIcon className="w-[15px] h-[15px]" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default AdminRail;
