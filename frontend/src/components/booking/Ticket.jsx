import Image from "next/image";

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
});

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
});

const Field = ({ label, children }) => (
    <div>
        <div className="text-[10.5px] text-c-grey-60 uppercase tracking-wider font-extrabold mb-1">{label}</div>
        <div className="text-sm font-bold text-c-grey-95 tabular-nums">{children}</div>
    </div>
);

const PosterFallback = () => (
    <div className="w-full h-full flex items-center justify-center text-c-grey-30">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5 20.5 5m-17.5 3.5L3 20l17.5-3.5M3 8.5l17.5-3.5m0 0L20.5 20 3 20" />
            <circle cx="8" cy="10.2" r="1" fill="currentColor" stroke="none" />
            <circle cx="12.3" cy="9.4" r="1" fill="currentColor" stroke="none" />
        </svg>
    </div>
);

/**
 * The ticket stub itself — a single, status-agnostic artifact. Whether it's
 * held or confirmed is the calling page's job to say ("Almost there" vs
 * "Your ticket"); the stub only ever shows what was booked.
 */
const Ticket = ({ booking }) => {
    const { showtime } = booking;

    return (
        <div className="max-w-[400px] w-full bg-c-black-08 border border-c-black-15 rounded-2xl overflow-hidden shadow-[0_20px_48px_-28px_rgba(0,0,0,0.7)]">

            {/*//! a hint of the brand accent along the top, the way a real stub
                carries a printed colour band */}
            <div className="h-[3px] bg-gradient-to-r from-c-red-45 via-c-red-60 to-c-red-45" />

            <div className="p-5 flex gap-4 items-start">
                <div className="w-20 shrink-0 aspect-thumbnail rounded-xl overflow-hidden bg-c-black-12 relative">
                    {showtime?.movie?.thumbnail ? (
                        <Image
                            src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${showtime.movie.thumbnail}`}
                            alt={showtime.movie.title}
                            width={160} height={180}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <PosterFallback />
                    )}
                </div>
                <div className="min-w-0 pt-0.5">
                    <h3 className="text-[17px] font-extrabold text-white leading-tight mb-1.5">
                        {showtime?.movie?.title || "—"}
                    </h3>
                    <p className="text-c-grey-70 text-[12.5px] leading-relaxed">
                        {showtime?.cinema?.name}{showtime?.cinema?.city ? ` · ${showtime.cinema.city}` : ""}
                    </p>
                    <p className="text-c-grey-60 text-[12.5px] leading-relaxed">
                        {[showtime?.hall?.name, showtime?.hall?.screenType, showtime?.language]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                </div>
            </div>

            {/*//! perforated tear line, the way a real ticket stub reads */}
            <div className="relative h-5 mx-5 border-t-[1.5px] border-dashed border-c-black-20">
                <span className="absolute -top-[11px] -left-[31px] w-5 h-5 rounded-full bg-c-black-06 border border-c-black-15" />
                <span className="absolute -top-[11px] -right-[31px] w-5 h-5 rounded-full bg-c-black-06 border border-c-black-15" />
            </div>

            <div className="pt-1 px-5 pb-5 grid grid-cols-2 gap-y-4 gap-x-4">
                <Field label="Date">{showtime?.startsAt ? formatDate(showtime.startsAt) : "—"}</Field>
                <Field label="Time">{showtime?.startsAt ? formatTime(showtime.startsAt) : "—"}</Field>
                <Field label="Seats">{booking.seats.map(seat => seat.label).join(", ")}</Field>
                <Field label="Total">${booking.totalPrice.toFixed(2)}</Field>
            </div>

            <div className="bg-c-black-10 border-t border-c-black-15 py-4 px-5 text-center">
                <div className="h-[46px] flex gap-[2px] items-stretch justify-center mb-2.5" aria-hidden="true">
                    {/*//! decorative stand-in for a scannable code; derived from the booking
                        code so the same ticket always renders the same bars */}
                    {booking.bookingCode.split("").flatMap((char, i) =>
                        Array.from({ length: 4 }, (_, j) => (
                            <i
                                key={`${i}-${j}`}
                                className="bg-c-grey-90 rounded-[1px] block"
                                style={{
                                    width: (char.charCodeAt(0) + j) % 3 === 0 ? "3px" : "1.5px",
                                    opacity: (char.charCodeAt(0) + j) % 5 === 0 ? 0.45 : 1,
                                }}
                            />
                        ))
                    )}
                </div>
                <div className="text-[15px] font-extrabold tracking-[0.16em] text-c-grey-97">
                    {booking.bookingCode}
                </div>
            </div>
        </div>
    );
}

export default Ticket;
