import { apiFetch } from "./apiClient";

//! the console is the only caller of these, and every one of them is behind the
//! same admin gate — so a 403 here means "you should not be on this page",
//! which the layout handles rather than each panel
const asError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    const { message } = data;

    const error = new Error(Array.isArray(message) ? message[0] : message || fallback);
    error.status = response.status;
    return error;
};

const get = async (path, fallback) => {
    const response = await apiFetch(path);
    if (!response.ok) throw await asError(response, fallback);

    return response.json();
};

const query = (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });

    return search.toString() ? `?${search}` : "";
};


export const fetchOverview = async (days) => {
    const { overview } = await get(`/admin/overview${query({ days })}`, "Couldn't load the overview.");
    return overview;
};

export const fetchBookings = (params) =>
    get(`/admin/bookings${query(params)}`, "Couldn't load bookings.");

export const refundBooking = async (bookingId, reason) => {
    const response = await apiFetch(`/admin/bookings/${bookingId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });

    if (!response.ok) throw await asError(response, "Couldn't refund that booking.");

    return response.json();
};

export const fetchUsers = (params) =>
    get(`/admin/users${query(params)}`, "Couldn't load users.");

export const setUserRole = async (userId, role) => {
    const response = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
    });

    if (!response.ok) throw await asError(response, "Couldn't change that role.");

    return response.json();
};

export const fetchCatalogue = (kind, params) =>
    get(`/admin/${kind}${query(params)}`, `Couldn't load ${kind}.`);

export const fetchReviews = (params) =>
    get(`/admin/reviews${query(params)}`, "Couldn't load reviews.");

export const deleteReview = async (reviewId) => {
    const response = await apiFetch(`/admin/reviews/${reviewId}`, { method: "DELETE" });
    if (!response.ok) throw await asError(response, "Couldn't remove that review.");
};
