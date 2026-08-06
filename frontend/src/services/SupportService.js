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

//? Console
export const fetchAllTickets = async () => {
    const response = await apiFetch('/support/');
    if (!response.ok) throw new Error("Couldn't load support tickets.");

    const data = await response.json();
    return data.supports;
};

export const setTicketStatus = async (ticketId, status) => {
    const response = await apiFetch(`/support/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Couldn't update that ticket.");
    }

    return response.json();
};

export const deleteTicket = async (ticketId) => {
    const response = await apiFetch(`/support/${ticketId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Couldn't delete that ticket.");
};

export const fetchMyTickets = async () => {
    const response = await apiFetch('/support/mine');
    if (!response.ok) throw new Error("Couldn't load your support tickets.");

    const data = await response.json();
    return data.supports;
};
