/**
 * What the genre rail shows when its request failed. It replaces an endless
 * skeleton, so it has two jobs the skeleton could not do: say plainly that
 * nothing is coming, and offer the one action that might fix it.
 */
const CategoryRailError = ({ onRetry }) => (
    <div className="w-full flex flex-col items-center text-center py-12 px-4
        bg-c-black-08 border border-c-black-15 rounded-xl">

        <div className="w-11 h-11 rounded-full bg-c-black-12 border border-c-black-15
            flex items-center justify-center mb-3.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" className="text-c-grey-60" aria-hidden="true">
                <path d="M12 8v5" />
                <path d="M12 16.5v.01" />
                <circle cx="12" cy="12" r="9" />
            </svg>
        </div>

        <p className="text-c-grey-90 font-semibold text-sm mb-1">Couldn&apos;t load categories</p>
        <p className="text-c-grey-60 text-[13px] max-w-xs mb-4">
            The catalogue didn&apos;t respond. Everything else on the page still works.
        </p>

        <button
            type="button"
            onClick={onRetry}
            className="bg-c-black-10 hover:bg-c-black-12 border border-c-black-15 rounded-lg
                py-2 px-5 text-super-sm text-c-grey-70 duration-200
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
            Try again
        </button>
    </div>
);

export default CategoryRailError;
