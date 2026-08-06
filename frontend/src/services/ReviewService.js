import { apiFetch } from "./apiClient";

export const fetchReviews = async (id) => {
    const response = await apiFetch(`/review/${id}`);
    const data = await response.json();
    return data.reviews;
}


export const addNewReview = async (data) => {
    const response = await apiFetch('/review/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(response.status === 500
            ? "Server error! Please try again later."
            : "Failed to Add Preview! Please try again later.");
    }

    return response.json();
}


//! A reader saying a review gives something away. The server returns the new
//! verdict rather than a bare 200, because whether one more report actually
//! tipped it over the threshold is the thing the button needs to know.
export const reportSpoiler = async (reviewId) => {
    const response = await apiFetch(`/review/${reviewId}/spoiler`, { method: 'POST' });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Couldn't report that review.");
    }

    return response.json();
}

export const withdrawSpoilerReport = async (reviewId) => {
    const response = await apiFetch(`/review/${reviewId}/spoiler`, { method: 'DELETE' });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Couldn't withdraw your report.");
    }

    return response.json();
}
