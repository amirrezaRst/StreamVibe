import PageHeader from "./PageHeader";

/**
 * A placeholder for a section whose rail entry exists but whose screen does
 * not yet. It says so plainly rather than 404ing — a dead link in your own
 * navigation is worse than an honest empty room.
 */
const NotBuiltYet = ({ title, crumbs, describes }) => (
    <>
        <PageHeader title={title} crumbs={crumbs} subtitle={describes} />
        <div className="p-[18px]">
            <div className="border border-dashed border-c-black-20 rounded-2xl py-12 px-6 text-center">
                <div className="w-[52px] h-[52px] rounded-full bg-c-black-10 border border-c-black-15 flex items-center justify-center mx-auto mb-4 text-c-grey-65">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M12 12 3 7M12 12l9-5M12 12v10" />
                    </svg>
                </div>
                <h2 className="text-c-grey-90 text-[15px] font-semibold mb-1.5">Not built yet</h2>
                <p className="text-c-grey-60 text-super-sm max-w-[46ch] mx-auto">
                    The API behind this section is ready — the screen is next.
                </p>
            </div>
        </div>
    </>
);

export default NotBuiltYet;
