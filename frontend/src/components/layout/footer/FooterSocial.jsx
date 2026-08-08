import { FacebookSvg, LinkedinSvg, TwitterSvg } from "@/assets/Svgs";

const SOCIALS = [
    { name: "Facebook", Icon: FacebookSvg },
    { name: "X", Icon: TwitterSvg },
    { name: "LinkedIn", Icon: LinkedinSvg },
];

const FooterSocial = () => {
    return (
        <div>
            <p className="text-white font-semibold 3xl:text-[1.45rem] mb-3.5">Connect With Us</p>

            {/*//! icon-only, so the label a screen reader announces is the only
                one there is. They are still inert — no account URLs exist yet —
                but an unnamed button reads out as "button" and tells nobody
                which platform they are on */}
            <div className="flex items-center start gap-3.5">
                {SOCIALS.map(({ name, Icon }) => (
                    <button
                        key={name}
                        type="button"
                        aria-label={`StreamVibe on ${name}`}
                        className="3xl:w-14 3xl:h-14 w-9 h-9 flex items-center justify-center btn-black-10 border border-c-black-15 rounded"
                    >
                        <Icon className="3xl:w-[26px] 3xl:h-[26px]" aria-hidden="true" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default FooterSocial;