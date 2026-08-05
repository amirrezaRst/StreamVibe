"use client";

import { SearchIcon } from "./AdminIcons";

export const SearchField = ({ value, onChange, placeholder }) => (
    <label className="flex items-center gap-2 bg-c-black-06 border border-c-black-20 rounded-[7px] py-1.5 px-2.5
        focus-within:border-c-black-25 duration-150 min-w-[200px]">
        <SearchIcon className="w-3.5 h-3.5 text-c-black-30 shrink-0" />
        <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="bg-transparent text-xs text-c-grey-90 placeholder:text-c-black-30 outline-none w-full"
        />
    </label>
);

export const Segmented = ({ options, value, onChange }) => (
    <div className="inline-flex bg-c-black-10 border border-c-black-20 rounded-lg p-0.5 gap-0.5">
        {options.map(option => (
            <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                aria-pressed={value === option.id}
                className={`text-xs font-bold py-[5px] px-[13px] rounded-md duration-150
                    ${value === option.id ? "bg-c-red-45/[0.12] text-c-red-80" : "text-c-grey-60 hover:text-c-grey-90"}`}
            >
                {option.label}
                {option.count !== undefined && <span className="opacity-70 ms-1.5">{option.count}</span>}
            </button>
        ))}
    </div>
);

//! Only ever mounted while something is ticked, so it never takes up room it
//! has not earned.
export const BulkBar = ({ count, onClear, children }) => (
    <div className="flex items-center gap-2.5 bg-c-red-45/[0.12] border border-c-red-45/30 rounded-lg py-2 px-3 mb-2.5 text-xs">
        <span className="font-extrabold text-c-red-80">{count} selected</span>
        <div className="ms-auto flex gap-2 items-center">
            {children}
            <button type="button" onClick={onClear} className="text-c-grey-60 hover:text-c-grey-90 px-2 duration-150">
                Clear
            </button>
        </div>
    </div>
);

/**
 * Three different nothings, told apart. "No records at all", "nothing matched
 * what you typed" and "the request failed" are different problems needing
 * different buttons — rendering one shrug for all three is how people end up
 * thinking a filter is broken.
 */
export const EmptyList = ({ searching, term, onClear, title, description }) => (
    <div className="border border-dashed border-c-black-20 rounded-xl py-10 px-6 text-center">
        <p className="text-c-grey-90 text-sm font-semibold mb-1">
            {searching ? `Nothing matches “${term}”` : title}
        </p>
        <p className="text-c-grey-60 text-[12.5px] mb-4 max-w-[42ch] mx-auto">
            {searching ? "Try a shorter search, or clear it to see everything." : description}
        </p>
        {searching && (
            <button
                type="button"
                onClick={onClear}
                className="bg-c-black-12 border border-c-black-20 hover:border-c-black-25 text-c-grey-90
                    rounded-[7px] py-1.5 px-4 text-xs font-bold duration-150"
            >
                Clear search
            </button>
        )}
    </div>
);

export const TableButton = ({ tone = "plain", children, ...props }) => {
    const tones = {
        plain: "border-c-black-20 bg-c-black-12 text-c-grey-65 hover:text-c-grey-90",
        danger: "border-c-red-45/35 text-c-red-80 hover:bg-c-red-45/[0.12]",
        good: "border-[#3DA872]/35 bg-[#3DA872]/[0.14] text-[#6FCB9C] hover:bg-[#3DA872]/25",
    };

    return (
        <button
            type="button"
            className={`rounded-[7px] py-1.5 px-2.5 text-[11px] font-bold border duration-150
                disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]}`}
            {...props}
        >
            {children}
        </button>
    );
};
