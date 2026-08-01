//! how long a seat selection is held before the seats go back on sale
const HOLD_MINUTES = 10;

//! per-booking cap, so one request can't hold an entire hall
const MAX_SEATS_PER_BOOKING = 10;

module.exports = { HOLD_MINUTES, MAX_SEATS_PER_BOOKING };
