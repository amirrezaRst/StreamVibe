import { apiFetch } from "./apiClient";

export const sendSupportRequest = async (data) => {
    const response = await apiFetch('/support/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(response.status === 500
            ? "Server error! Please try again later."
            : "Failed to send message! Please try again later.");
    }
};

export const fetchMyTickets = async () => {
    const response = await apiFetch('/support/mine');
    if (!response.ok) throw new Error("Couldn't load your support tickets.");

    const data = await response.json();
    return data.supports;
};
