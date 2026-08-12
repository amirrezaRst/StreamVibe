import Link from "next/link";

import { FacebookSvg, GithubSvg, LinkedinSvg, TwitterSvg } from "@/assets/Svgs";

//! GitHub is the one entry here with a real, verifiable destination — the
//! project's own public repo — so it's a working link. The other three
//! stay inert: StreamVibe has no Facebook/X/LinkedIn presence to link to,
//! and a placeholder URL would be a broken link wearing a working one's
//! clothes, worse than a button that plainly does nothing yet.
const iconClass = "3xl:w-14 3xl:h-14 w-9 h-9 flex items-center justify-center btn-black-10 border border-c-black-15 rounded duration-150";

const INERT_SOCIALS = [
    { name: "Facebook", Icon: FacebookSvg },
    { name: "X", Icon: TwitterSvg },
    { name: "LinkedIn", Icon: LinkedinSvg },
];

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

                {/*//! icon-only, so the label a screen reader announces is the
                    only one there is. Still inert — see note above. */}
                {INERT_SOCIALS.map(({ name, Icon }) => (
                    <button
                        key={name}
                        type="button"
                        aria-label={`StreamVibe on ${name}`}
                        className={iconClass}
                    >
                        <Icon className="3xl:w-[26px] 3xl:h-[26px]" aria-hidden="true" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default FooterSocial;
