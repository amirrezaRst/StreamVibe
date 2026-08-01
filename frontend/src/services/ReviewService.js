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
}
