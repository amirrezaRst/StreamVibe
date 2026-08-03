import Link from "next/link";

import { HomeIcon } from "@/assets/Svgs";

/**
 * The branded half of the auth screens — same poster backdrop, logo and
 * "Back to Home" affordance the register page uses, so login, signup and the
 * password-reset flow all read as one place.
 *
 * Hidden below lg, where the form takes the full width instead of being
 * squeezed into half a phone screen.
 */
const AuthAside = ({ title, children, actionHref, actionLabel }) => (
    <aside className="hidden lg:block w-[50%] h-full bg-[url('/images/header-banner.jpg')] bg-cover bg-center overflow-hidden">
        <div className="w-full h-full bg-c-black-06/65 px-14 py-8">

            <div className="flex items-center justify-between">
                <img
                    src="/images/logo-white.png"
                    alt="stream vibe logo"
                    className="3xl:w-full lg:w-[165px] w-[150px]"
                />
                <Link href="/">
                    <span className="text-white flex gap-2">Back to Home <HomeIcon /></span>
                </Link>
            </div>

            <div className="mt-20">
                <h1 className="text-white text-3xl font-semibold">{title}</h1>

                <p className="text-white/80 mt-10 text-base leading-7 mb-10">
                    {children}
                </p>

                {actionHref && (
                    <Link href={actionHref}>
                        <button
                            type="button"
                            className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5"
                        >
                            {actionLabel}
                        </button>
                    </Link>
                )}
            </div>

        </div>
    </aside>
);

export default AuthAside;
