/**
 * The same metal ladder the public seat picker uses — steel, bronze, gold. Red
 * is deliberately not among them: on the booking page red means "this seat is
 * yours", and a tier that borrowed it would be unreadable there.
 *
 * `gap` is not a tier. It is the absence of a seat, which is how aisles,
 * walkways and wheelchair spaces are drawn.
 */
export const TIERS = [
    { id: "standard", label: "Standard", fill: "#3C4450", border: "#48505C", key: "1" },
    { id: "premium", label: "Premium", fill: "#7A4E24", border: "#8A5A2B", key: "2" },
    { id: "vip", label: "VIP", fill: "#7A6519", border: "#8A7320", key: "3" },
];

export const GAP = { id: "gap", label: "No seat", fill: "transparent", border: "#333333", key: "0" };

export const PAINTS = [...TIERS, GAP];

export const tierOf = (id) => TIERS.find(tier => tier.id === id) || TIERS[0];

export const seatLabel = (row, number) => `${String(row).toUpperCase()}${number}`;

//! bookable seats only — a gap is layout, not inventory
export const countSeats = (seatMap = []) => seatMap.reduce(
    (total, row) => total + row.seats.filter(seat => !seat.disabled).length, 0
);

export const countByTier = (seatMap = []) => seatMap.reduce((tally, row) => {
    row.seats.forEach(seat => {
        if (seat.disabled) return;
        tally[seat.tier] = (tally[seat.tier] || 0) + 1;
    });
    return tally;
}, {});

export const countGaps = (seatMap = []) => seatMap.reduce(
    (total, row) => total + row.seats.filter(seat => seat.disabled).length, 0
);

//! A, B … Z, then AA, AB — enough for any hall anyone will build here
export const nextRowLabel = (existing = []) => {
    const taken = new Set(existing.map(row => String(row.row).toUpperCase()));

    for (let i = 0; i < 26 * 27; i++) {
        const label = i < 26
            ? String.fromCharCode(65 + i)
            : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26));
        if (!taken.has(label)) return label;
    }
    return `R${existing.length + 1}`;
};

/**
 * A rectangular starting layout. Painting a forty-by-twelve hall one seat at a
 * time is not a job anybody finishes, and almost every hall starts as a grid
 * before the aisles are cut into it.
 */
export const generateGrid = ({ rows, seatsPerRow, aisleEvery, tier = "standard" }) => {
    const map = [];

    for (let r = 0; r < rows; r++) {
        const label = nextRowLabel(map);
        const seats = [];

        for (let n = 1; n <= seatsPerRow; n++) {
            seats.push({
                number: n,
                tier,
                //! an aisle is a seat marked as a gap, so numbering stays
                //! continuous and a customer's "seat 7" is always the seventh
                disabled: Boolean(aisleEvery) && n % aisleEvery === 0 && n !== seatsPerRow,
            });
        }

        map.push({ row: label, seats });
    }

    return map;
};
