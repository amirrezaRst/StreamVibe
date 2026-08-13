import Link from "next/link";
import { BellSvg, CheckIcon, ClockIcon, EnvelopeIcon } from "@/assets/Svgs";
import useNotificationStore from "@/stores/useNotificationStore";

//! EnvelopeIcon/CheckIcon already draw with stroke:currentColor, so the wrapper's
//! text-color class alone recolors them. ClockIcon hardcodes its own fill on
//! the path instead — [&>svg]:fill-current is a real stylesheet rule, which
//! beats that presentation attribute and recolors it too. Applying that same
//! override to the stroke icons would flip their fill:none to filled solid,
//! so it's scoped to ClockIcon's two variants only.
const VARIANT = {
    ticket_progress: { Icon: EnvelopeIcon, tone: "text-[#6FA8E8] bg-[#4C8DD9]/[0.12]" },
    ticket_resolved: { Icon: CheckIcon, tone: "text-[#4ECB8B] bg-[#3BB273]/[0.12]" },
    sub_expiring: { Icon: ClockIcon, tone: "text-[#FF6B6B] bg-c-red-45/[0.12] [&>svg]:fill-current" },
    sub_expired: { Icon: ClockIcon, tone: "text-[#FF6B6B] bg-c-red-45/[0.12] [&>svg]:fill-current" },
};

//! deliberately coarse (hours/days, not minutes/seconds) — nothing here is
//! time-critical enough to need finer resolution, and it keeps the row short
const relativeTime = (isoDate) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
};

const NotificationList = ({ onNavigate }) => {
    const notifications = useNotificationStore((state) => state.notifications);
    const markOneRead = useNotificationStore((state) => state.markOneRead);

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center text-center px-8 py-11">
                <BellSvg className="w-9 h-9 mb-3.5 opacity-30" aria-hidden="true" />
                <strong className="block text-c-grey-90 text-sm mb-1">You&apos;re all caught up</strong>
                <span className="text-c-grey-55 text-xs">Ticket replies and plan reminders will show up here.</span>
            </div>
        );
    }

    return (
        <ul>
            {notifications.map((item) => {
                const { Icon, tone } = VARIANT[item.variant] || VARIANT.ticket_progress;
                const unread = !item.read;

                const content = (
                    <>
                        <span className={`w-[34px] h-[34px] rounded-[9px] shrink-0 mt-px flex items-center justify-center ${tone}`}>
                            <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className={`block text-[13px] leading-relaxed ${unread ? "text-white" : "text-c-grey-90"}`}>
                                {item.message}
                            </span>
                            <span className="block text-[11.5px] text-c-grey-55 mt-1">{relativeTime(item.createdAt)}</span>
                        </span>
                        <span className={`w-[7px] h-[7px] rounded-full shrink-0 mt-1.5 ${unread ? "bg-c-red-45" : "bg-transparent"}`} aria-hidden="true" />
                    </>
                );

                const rowClass = `flex items-start gap-3 px-4 py-3.5 border-b border-c-black-12 last:border-none transition-colors
                    ${unread ? "bg-c-red-45/[0.05] hover:bg-c-red-45/[0.09]" : "hover:bg-c-black-10"}`;

                const handleClick = () => {
                    markOneRead(item._id);
                    onNavigate?.();
                };

                return (
                    <li key={item._id}>
                        {item.link ? (
                            <Link href={item.link} className={rowClass} onClick={handleClick}>
                                {content}
                            </Link>
                        ) : (
                            <button type="button" className={`${rowClass} w-full text-left`} onClick={handleClick}>
                                {content}
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default NotificationList;
