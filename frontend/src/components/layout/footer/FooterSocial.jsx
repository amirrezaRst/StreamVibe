import Link from "next/link";

import { GithubSvg } from "@/assets/Svgs";

//! Facebook/X/LinkedIn were dropped rather than left as inert placeholder
//! buttons — StreamVibe has no real presence on those platforms, and an
//! icon that visibly does nothing is worse clutter than no icon at all.
//! GitHub stays: it's a real, verifiable destination — the project's own
//! public repo.
const iconClass = "3xl:w-14 3xl:h-14 w-9 h-9 flex items-center justify-center btn-black-10 border border-c-black-15 rounded duration-150";

const FooterSocial = () => {
    return (
        <div>
            <p className="text-white font-semibold 3xl:text-[1.45rem] mb-3.5">Connect With Us</p>

            <div className="flex items-center start gap-3.5">
                <Link
                    href="https://github.com/amirrezaRst/StreamVibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="StreamVibe on GitHub"
                    className={`${iconClass} hover:border-c-grey-60`}
                >
                    <GithubSvg className="3xl:w-[26px] 3xl:h-[26px]" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}

export default FooterSocial;
