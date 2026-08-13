"use client";

import { useEffect, useRef, useState } from "react";
import { BellSvg } from "@/assets/Svgs";
import useNotificationStore from "@/stores/useNotificationStore";
import NotificationPanel from "@/components/notification/NotificationPanel";

const NotificationButton = () => {
    const [open, setOpen] = useState(false);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (event) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="relative focus:outline-none focus:border-none mx-2.5 md:inline hidden"
            >
                <BellSvg className="3xl:w-[2.4rem] 3xl:h-[2.4rem]" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-[3px] rounded-full bg-c-red-45 text-white text-[10px]
                            font-extrabold flex items-center justify-center border-2 border-c-black-08 [font-variant-numeric:tabular-nums]"
                        aria-hidden="true"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && <NotificationPanel onClose={() => setOpen(false)} />}
        </div>
    );
};

export default NotificationButton;
