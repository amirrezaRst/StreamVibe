//! mirrors PersonCard's exact box model (aspect-square photo, name line,
//! meta line) so nothing shifts when the real cards swap in — only the
//! `--sk-delay` value differs per card, staggering the shimmer across the grid
const PersonCardSkeleton = ({ delay = 0 }) => {
    const style = { "--sk-delay": `${delay}ms` };

    return (
        <div>
            <div style={style} className="skeleton-pulse skeleton-sweep aspect-square rounded-2xl border border-c-black-15 bg-c-black-15" />

            <div style={style} className="skeleton-pulse skeleton-sweep mt-2.5 h-[13px] w-3/4 rounded-md bg-c-black-15" />

            <div className="mt-[7px] flex items-center gap-1.5">
                <div style={style} className="skeleton-pulse skeleton-sweep w-[11px] h-[11px] rounded-full bg-c-black-15 shrink-0" />
                <div style={style} className="skeleton-pulse skeleton-sweep h-[10px] w-1/2 rounded-md bg-c-black-15" />
            </div>
        </div>
    );
}

export default PersonCardSkeleton;
