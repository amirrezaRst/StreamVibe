"use client";

import { useEffect, useState } from "react";

const secondsLeft = (expiresAt) => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));

/**
 * Counts down the server-issued hold. The deadline comes from the API rather
 * than being started client-side, so a slow render or a reload can't quietly
 * give the user more time than the seats are actually held for.
 */
const HoldTimer = ({ expiresAt, onExpire }) => {
    const [left, setLeft] = useState(() => secondsLeft(expiresAt));

    useEffect(() => {
        setLeft(secondsLeft(expiresAt));

        const id = setInterval(() => {
            const remaining = secondsLeft(expiresAt);
            setLeft(remaining);

            if (remaining <= 0) {
                clearInterval(id);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(id);
    }, [expiresAt, onExpire]);

    const minutes = Math.floor(left / 60);
    const seconds = String(left % 60).padStart(2, "0");
    const urgent = left <= 60;

    return (
        <div className="flex items-center gap-2.5 mt-3.5 py-2.5 px-3 bg-c-red-45/[0.13] border border-c-red-45/30 rounded-[10px]">
            <svg className="shrink-0" width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={urgent ? "#FF1A1A" : "#FF5555"} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" opacity=".3" />
                <path d="M12 7v5l3 2" />
            </svg>
            <div className="text-[12.5px] text-c-grey-70 leading-snug">
                <b className="block text-sm text-white tabular-nums">{minutes}:{seconds}</b>
                {left > 0
                    ? "Seats held for you — complete payment before the timer runs out."
                    : "Your hold expired and the seats were released."}
            </div>
        </div>
    );
}

export default HoldTimer;
