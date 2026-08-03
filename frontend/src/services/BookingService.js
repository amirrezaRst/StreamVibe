import { apiFetch } from "./apiClient";

//! losing a seat race is an expected outcome, not a crash — the thrown error
//! carries the seats that were taken so the UI can point at them
const asError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));

    const error = new Error(data.message || fallback);
    error.status = response.status;
    error.takenSeats = data.takenSeats;
    return error;
}

export const holdSeats = async (showtimeId, seats) => {
    const response = await apiFetch('/booking', {
        method: 'POST',
        body: JSON.stringify({ showtime: showtimeId, seats }),
    });

    if (!response.ok) throw await asError(response, "Couldn't hold those seats. Please try again.");

    return response.json();
}

export const confirmBooking = async (bookingId) => {
    const response = await apiFetch(`/booking/${bookingId}/confirm`, { method: 'POST' });

    if (!response.ok) throw await asError(response, "Couldn't confirm your booking. Please try again.");

    return response.json();
}

export const cancelBooking = async (bookingId) => {
    const response = await apiFetch(`/booking/${bookingId}/cancel`, { method: 'POST' });

    if (!response.ok) throw await asError(response, "Couldn't cancel your booking. Please try again.");

    return response.json();
}

//? Payment
export const createCheckout = async (bookingId) => {
    const response = await apiFetch(`/booking/${bookingId}/checkout`, { method: 'POST' });

    if (!response.ok) throw await asError(response, "Couldn't start the payment. Please try again.");

    return response.json();
}

//! the browser only carries the session id back; whether it was actually paid
//! is something only the server can establish with the gateway
export const verifyCheckout = async (bookingId, sessionId) => {
    const response = await apiFetch(`/booking/${bookingId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) throw await asError(response, "Couldn't confirm your payment.");

    return response.json();
}

export const fetchMyBookings = async () => {
    try {
        const response = await apiFetch('/booking/mine');
        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        return data.bookings;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
}

export const fetchBooking = async (bookingId) => {
    const response = await apiFetch(`/booking/${bookingId}`);
    if (!response.ok) throw await asError(response, "Couldn't load that booking.");

    return response.json();
}
