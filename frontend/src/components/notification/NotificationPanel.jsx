"use client";

import { useEffect } from "react";
import useNotificationStore from "@/stores/useNotificationStore";
import NotificationList from "./NotificationList";

const NotificationPanel = ({ onClose }) => {
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const markAllRead = useNotificationStore((state) => state.markAllRead);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            role="region"
            aria-label="Notifications"
            className="absolute top-[calc(100%+10px)] right-0 w-[380px] max-w-[calc(100vw-32px)] bg-c-black-08 border border-c-black-15
                rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-40"
        >
            <div className="flex items-center justify-between px-[18px] py-4 border-b border-c-black-15">
                <h3 className="text-white font-extrabold text-[15px] m-0">Notifications</h3>
                <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-c-red-60 hover:text-c-red-80 disabled:text-c-grey-55 disabled:opacity-60 text-xs font-bold disabled:cursor-default"
                >
                    Mark all as read
                </button>
            </div>
            <div className="max-h-[392px] overflow-y-auto custom-scrollbar custom-scrollbar-sm">
                <NotificationList onNavigate={onClose} />
            </div>
        </div>
    );
};

export default NotificationPanel;
