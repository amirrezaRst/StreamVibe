import MovieCardSkeleton from "@/components/MovieCardSkeleton";

//! same shimmer/pulse tokens PersonCardSkeleton uses on the browse grid —
//! one visual language for "this is still loading" across the person system
const bar = (extra = "", delay = 0) => (
    <div style={{ "--sk-delay": `${delay}ms` }} className={`skeleton-pulse skeleton-sweep rounded-md bg-c-black-15 ${extra}`} />
);

const Panel = ({ children }) => (
    <div className="bg-c-black-10 border border-c-black-15 rounded-2xl xl:p-6 md:p-5 p-4">
        {bar("h-3 w-28 mb-4")}
        {children}
    </div>
);

/**
 * Mirrors PersonPage's exact box model — hero, the two-column body, then two
 * credit rows — so nothing shifts when the real data swaps in. Next.js shows
 * this automatically: /actors/[slug]/page.jsx is an async Server Component,
 * and the sibling loading.jsx wraps it in a Suspense boundary with this as
 * the fallback, with no manual wiring on the page's part.
 */
const PersonPageSkeleton = () => {
    return (
        <main className="container md:pt-10 pt-5 md:pb-20 pb-10">
            <section className="rounded-2.5xl border border-c-black-15 bg-c-black-10 overflow-hidden">
                <div className="flex md:flex-row flex-col md:items-end items-start gap-6 xl:p-9 md:p-7 p-5">
                    {bar("xl:w-[168px] md:w-[136px] w-[104px] aspect-square shrink-0 !rounded-2xl")}

                    <div className="min-w-0 flex-1">
                        {bar("h-3 w-16 mb-4", 60)}
                        {bar("h-8 w-64 max-w-full mb-4", 120)}
                        <div className="flex flex-wrap gap-4">
                            {bar("h-3.5 w-28", 180)}
                            {bar("h-3.5 w-36", 240)}
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-12 xl:gap-6 gap-4 mt-5">
                <div className="lg:col-span-8 col-span-12 flex flex-col gap-4">
                    <Panel>
                        <div className="flex flex-col gap-3">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-3.5">
                                    {bar("w-[46px] h-[69px] shrink-0 !rounded-md", i * 80)}
                                    <div className="flex-1 min-w-0">
                                        {bar("h-3.5 w-3/5 mb-2", i * 80 + 40)}
                                        {bar("h-3 w-2/5", i * 80 + 80)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel>
                        <div className="flex flex-col gap-2.5">
                            {bar("h-3 w-full", 100)}
                            {bar("h-3 w-full", 160)}
                            {bar("h-3 w-2/3", 220)}
                        </div>
                    </Panel>
                </div>

                <div className="lg:col-span-4 col-span-12 flex flex-col gap-4">
                    <Panel>
                        <div className="flex flex-wrap gap-2">
                            {bar("h-7 w-24", 60)}
                            {bar("h-7 w-20", 120)}
                        </div>
                    </Panel>

                    <Panel>
                        <div className="flex flex-wrap gap-2">
                            {bar("h-7 w-32", 60)}
                            {bar("h-7 w-28", 120)}
                            {bar("h-7 w-24", 180)}
                        </div>
                    </Panel>
                </div>
            </div>

            {[0, 1].map((row) => (
                <section key={row} className="mt-10">
                    <div className="mb-4">{bar("h-5 w-52", row * 100)}</div>
                    <div className="flex lg:gap-8 gap-4 flex-nowrap overflow-x-auto pb-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
}

export default PersonPageSkeleton;
