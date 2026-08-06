import { tierOf } from "./seatTiers";

/**
 * A hall at a glance. Two rooms called "Screen 2" in different buildings are
 * told apart by shape far faster than by any label, so the list draws the real
 * layout rather than an icon.
 *
 * Rows beyond the first few add nothing at this size, so it samples evenly
 * across the hall instead of showing the top and cutting the rest.
 */
const SeatMapThumb = ({ seatMap = [], rows = 3, cols = 8 }) => {
    if (!seatMap.length) {
        return (
            <div className="flex flex-col gap-[2px] shrink-0" aria-hidden="true">
                {Array.from({ length: rows }, (_, r) => (
                    <div key={r} className="flex gap-[2px]">
                        {Array.from({ length: cols }, (_, c) => (
                            <i key={c} className="w-[5px] h-1 rounded-[1px] block bg-c-black-20" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    const step = Math.max(1, Math.floor(seatMap.length / rows));
    const sampled = Array.from({ length: Math.min(rows, seatMap.length) }, (_, i) => seatMap[i * step]);

    return (
        <div className="flex flex-col gap-[2px] shrink-0" aria-hidden="true">
            {sampled.map((row, r) => {
                const seatStep = Math.max(1, Math.floor(row.seats.length / cols));
                const seats = Array.from(
                    { length: Math.min(cols, row.seats.length) },
                    (_, i) => row.seats[i * seatStep]
                );

                return (
                    <div key={r} className="flex gap-[2px]">
                        {seats.map((seat, c) => (
                            <i
                                key={c}
                                className="w-[5px] h-1 rounded-[1px] block"
                                style={{ background: seat.disabled ? "transparent" : tierOf(seat.tier).fill }}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMapThumb;
