//! Placeholders match the real cards' footprint so the panel doesn't jump
//! when the data lands.
const PanelSkeleton = ({ variant = "list", count = 4 }) => {
    if (variant === "grid") {
        return (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-[18px]">
                {Array.from({ length: count }, (_, i) => (
                    <div key={i} className="bg-c-black-10 border border-c-black-15 rounded-xl p-2.5">
                        <div className="aspect-thumbnail rounded-[9px] bg-c-black-12 animate-pulse" />
                        <div className="h-3.5 w-4/5 rounded bg-c-black-12 animate-pulse mt-3 mb-2" />
                        <div className="h-3 w-1/3 rounded bg-c-black-12 animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="bg-c-black-10 border border-c-black-15 rounded-xl h-[82px] animate-pulse" />
            ))}
        </div>
    );
}

export default PanelSkeleton;
