//! Sorted descending with the value printed on every row — a ranked bar chart
//! rather than a pie, because the question is "which title is pulling" and a
//! pie cannot answer that.
const TopTitles = ({ titles }) => {
    const most = Math.max(...titles.map(t => t.tickets), 1);

    return (
        <section className="bg-c-black-10 border border-c-black-15 rounded-[10px] p-3.5">
            <header className="flex items-center gap-2.5 mb-3">
                <h2 className="text-[13px] font-extrabold">Top titles by tickets</h2>
            </header>

            {titles.length === 0 ? (
                <p className="text-c-grey-60 text-[12.5px] py-4">
                    No tickets sold in this window yet.
                </p>
            ) : (
                <ol className="flex flex-col gap-[9px] list-none m-0 p-0">
                    {titles.map(title => (
                        <li key={title._id} className="grid grid-cols-[96px_1fr_44px] items-center gap-2.5 text-[11.5px]">
                            <span className="text-c-grey-65 truncate capitalize" title={title.title}>{title.title}</span>
                            <span className="h-4 bg-c-black-06 rounded overflow-hidden">
                                <span
                                    className="h-full rounded block bg-gradient-to-r from-c-red-45/55 to-c-red-45"
                                    style={{ width: `${Math.max((title.tickets / most) * 100, 4)}%` }}
                                />
                            </span>
                            <span className="text-end text-c-grey-90 font-bold tabular-nums">{title.tickets}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

export default TopTitles;
