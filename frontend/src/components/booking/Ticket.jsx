import Image from "next/image";

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
});

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
});

const STATUS_STYLE = {
    confirmed: "bg-[#3DA872]/[0.16] text-[#6FCB9C]",
    pending: "bg-[#D99A34]/[0.16] text-[#E8B663]",
    cancelled: "bg-c-red-45/[0.16] text-c-red-80",
    expired: "bg-c-black-20 text-c-grey-60",
};

const Field = ({ label, children }) => (
    <div>
        <div className="text-[10.5px] text-c-grey-60 uppercase tracking-wider font-extrabold mb-1">{label}</div>
        <div className="text-sm font-bold text-c-grey-95 tabular-nums">{children}</div>
    </div>
);

const Ticket = ({ booking }) => {
    const { showtime } = booking;
    const status = booking.status;

    return (
        <div className="max-w-[400px] bg-c-black-08 border border-c-black-15 rounded-2xl overflow-hidden">

            <div className="p-5 flex gap-4 items-start">
                <div className="w-[74px] shrink-0 aspect-thumbnail rounded-xl overflow-hidden bg-c-black-12 relative">
                    {showtime?.movie?.thumbnail && (
                        <Image
                            src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${showtime.movie.thumbnail}`}
                            alt={showtime.movie.title}
                            width={148} height={166}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-[16.5px] font-extrabold text-white mb-1">{showtime?.movie?.title}</h3>
                    <p className="text-c-grey-60 text-[12.5px]">
                        {showtime?.cinema?.name} · {showtime?.cinema?.city}
                    </p>
                    <p className="text-c-grey-60 text-[12.5px]">
                        {showtime?.hall?.name} · {showtime?.hall?.screenType} · {showtime?.language}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-full ${STATUS_STYLE[status] || STATUS_STYLE.expired}`}>
                        {status}
                    </span>
                </div>
            </div>

            {/*//! perforated tear line, the way a real ticket stub reads */}
            <div className="relative h-5 mx-5 border-t-[1.5px] border-dashed border-c-black-20">
                <span className="absolute -top-[11px] -left-[31px] w-5 h-5 rounded-full bg-c-black-06 border border-c-black-15" />
                <span className="absolute -top-[11px] -right-[31px] w-5 h-5 rounded-full bg-c-black-06 border border-c-black-15" />
            </div>

            <div className="pt-1 px-5 pb-[18px] grid grid-cols-2 gap-4">
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
