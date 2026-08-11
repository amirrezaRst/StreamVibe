import Link from "next/link";

import { LockIcon } from "@/assets/Svgs";

/**
 * Sits above the download rows when the viewer's plan cannot download at all —
 * either because they have no active plan, or because they are on Basic, which
 * deliberately excludes downloads.
 */
const DownloadLockedNotice = ({ plan }) => (
    <div className="flex md:flex-row flex-col md:items-center items-start gap-3 justify-between
        bg-c-black-08 border border-c-black-15 rounded-lg md:px-6 px-4 md:py-4 py-3.5 mb-4">
        <div className="flex items-start gap-3">
            <LockIcon className="w-4 h-4 text-c-grey-60 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-c-grey-65 md:text-super-sm text-xs m-0">
                {plan
                    ? <>Downloads aren&apos;t included in the <span className="text-c-grey-90 font-semibold">{plan}</span> plan.</>
                    : "Downloads are included with a StreamVibe plan."}
            </p>
        </div>

        <Link
            href="/subscriptions"
            className="bg-c-black-10 hover:bg-c-black-12 border border-c-black-20 text-c-grey-90
                md:text-xs text-[11px] font-semibold rounded-lg py-2 px-4 duration-150 shrink-0"
        >
            {plan ? "Upgrade plan" : "View plans"}
        </Link>
    </div>
);

export default DownloadLockedNotice;
