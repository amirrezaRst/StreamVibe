"use client";

import Seat from "./Seat";
import SeatLegend from "./SeatLegend";

const SeatMap = ({ seatMap, pricing, bookedSeats, selectedSeats, onToggle }) => {
    const taken = new Set(bookedSeats);
    const selected = new Set(selectedSeats.map(seat => seat.label));

    return (
        <div className="bg-c-black-08 border border-c-black-15 rounded-2xl p-5">

            {/*//! curved screen, glowing in the brand red */}
            <div className="pt-1.5 pb-7 text-center">
                <div
                    className="h-[52px] w-[88%] max-w-[560px] mx-auto relative border-t-2 border-c-red-45
                               rounded-[50%/100%_100%_0_0] bg-gradient-to-b from-c-red-45/20 to-transparent
                               drop-shadow-[0_-6px_22px_rgba(229,0,0,0.4)]"
                >
                    <span className="absolute top-4 inset-x-0 text-[11px] font-extrabold tracking-[0.42em] indent-[0.42em] text-c-grey-70">
                        SCREEN
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-[7px] items-center overflow-x-auto pb-2">
                {seatMap.map(({ row, seats }) => (
                    <div key={row} className="flex items-center gap-[7px]">
                        <span className="w-[18px] shrink-0 text-center text-c-grey-60 text-[11.5px] font-extrabold">
                            {row}
                        </span>

                        {seats.map(seat => {
                            const label = `${row}${seat.number}`;
                            return (
                                <Seat
                                    key={label}
                                    label={label}
                                    number={seat.number}
                                    tier={seat.tier}
                                    price={pricing?.[seat.tier]}
                                    disabled={seat.disabled}
                                    taken={taken.has(label)}
                                    selected={selected.has(label)}
                                    onToggle={onToggle}
                                />
                            );
                        })}

                        <span className="w-[18px] shrink-0 text-center text-c-grey-60 text-[11.5px] font-extrabold">
                            {row}
                        </span>
                    </div>
                ))}
            </div>

            <SeatLegend pricing={pricing} />
        </div>
    );
}

export default SeatMap;
