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

export const fetchPeople = (params) =>
    get(`/admin/people${query(params)}`, "Couldn't load people.");


//? Cinema
export const fetchCinemas = (params) =>
    get(`/admin/cinemas${query(params)}`, "Couldn't load cinemas.");

export const fetchCinema = (cinemaId) =>
    get(`/admin/cinemas/${cinemaId}`, "Couldn't load that cinema.");

export const fetchHall = (hallId) =>
    get(`/admin/halls/${hallId}`, "Couldn't load that hall.");

export const fetchSchedule = (params) =>
    get(`/admin/schedule${query(params)}`, "Couldn't load the schedule.");

export const fetchSchedulableMovies = () =>
    get("/admin/schedulable-movies", "Couldn't load the film list.");

export const fetchBooking = (bookingId) =>
    get(`/admin/bookings/${bookingId}`, "Couldn't load that booking.");

//! writes go through the endpoints that already existed for each model — there
//! was never a gap on the writing side, only on the reading side
export const saveSeatMap = async (hallId, seatMap) => {
    const response = await apiFetch(`/cinema/halls/${hallId}`, {
        method: "PUT",
        body: JSON.stringify({ seatMap }),
    });

    if (!response.ok) throw await asError(response, "Couldn't save the seat map.");

    return response.json();
};

export const createShowtime = async (payload) => {
    const response = await apiFetch("/showtime", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw await asError(response, "Couldn't schedule that screening.");

    return response.json();
};

export const createShowtimeRun = async (payload) => {
    const response = await apiFetch("/showtime/run", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw await asError(response, "Couldn't schedule that run.");

    return response.json();
};

export const deleteShowtime = async (showtimeId) => {
    const response = await apiFetch(`/showtime/${showtimeId}`, { method: "DELETE" });
    if (!response.ok) throw await asError(response, "Couldn't remove that screening.");
};

//! the console writes through the endpoints that already exist for each model —
//! there was never a gap on the writing side, only on the reading side
const remove = (path, fallback) => async (id) => {
    const response = await apiFetch(`/${path}/${id}`, { method: "DELETE" });
    if (!response.ok) throw await asError(response, fallback);
};

export const deleteMovie = remove("movie", "Couldn't delete that movie.");
export const deleteSeries = remove("series", "Couldn't delete that series.");
export const deleteActor = remove("actor", "Couldn't delete that actor.");
export const deleteDirector = remove("director", "Couldn't delete that director.");
export const deleteUser = remove("user/user", "Couldn't delete that user.");

export const fetchReviews = (params) =>
    get(`/admin/reviews${query(params)}`, "Couldn't load reviews.");

export const moderateReview = async (reviewId, status, reason) => {
    const response = await apiFetch(`/admin/reviews/${reviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify(status === "rejected" && reason ? { status, reason } : { status }),
    });

    if (!response.ok) throw await asError(response, "Couldn't update that review.");

    return response.json();
};

//! one request for a whole selection — the point of the checkboxes is that
//! twenty obvious approvals should not be twenty round trips
export const moderateReviews = async (ids, status, reason) => {
    const response = await apiFetch("/admin/reviews/status", {
        method: "PATCH",
        body: JSON.stringify(status === "rejected" && reason ? { ids, status, reason } : { ids, status }),
    });

    if (!response.ok) throw await asError(response, "Couldn't update those reviews.");

    return response.json();
};

export const setReviewSpoiler = async (reviewId, spoiler) => {
    const response = await apiFetch(`/admin/reviews/${reviewId}/spoiler`, {
        method: "PATCH",
        body: JSON.stringify({ spoiler }),
    });

    if (!response.ok) throw await asError(response, "Couldn't change the spoiler warning.");

    return response.json();
};

export const deleteReview = async (reviewId) => {
    const response = await apiFetch(`/admin/reviews/${reviewId}`, { method: "DELETE" });
    if (!response.ok) throw await asError(response, "Couldn't remove that review.");
};
