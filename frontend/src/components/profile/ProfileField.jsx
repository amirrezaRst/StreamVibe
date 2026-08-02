"use client";

import { useState } from "react";
import { EyeOffIcon, EyeOutlineIcon } from "@/assets/Svgs";

/**
 * A labelled input for the account forms. The label stays visible rather than
 * living in the placeholder, so it is still readable once the field is filled
 * in — which, on a settings page, is the normal state.
 */
const ProfileField = ({ id, label, type = "text", placeholder, hint, error, register, validation, autoComplete }) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";

    return (
        <div className="mb-[18px]">
            <label htmlFor={id} className="block text-[13.5px] font-semibold text-c-grey-90 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={isPassword && revealed ? "text" : type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={error ? "true" : "false"}
                    className={`support-input-field !mt-0 bg-c-black-08 ${isPassword ? "pe-11" : ""}
                        ${error ? "!border-c-red-60 focus:!ring-c-red-60/60" : ""}`}
                    {...register(id, validation)}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed(current => !current)}
                        aria-label={revealed ? "Hide password" : "Show password"}
                        className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-c-grey-60 hover:text-c-grey-90 duration-150"
                    >
                        {revealed ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeOutlineIcon className="w-[18px] h-[18px]" />}
                    </button>
                )}
            </div>
            {/*//! the rule lives under the field rather than inside it, so it is
                still readable while the field is being filled in */}
            {error
                ? <span className="block text-[12.5px] text-[#FF8A8A] mt-1.5">{error.message}</span>
                : hint && <span className="block text-[12.5px] text-c-grey-60 mt-1.5">{hint}</span>}
        </div>
    );
}

export default ProfileField;
