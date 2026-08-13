import { apiFetch } from "./apiClient";

export const fetchNotifications = async () => {
    const response = await apiFetch('/notification/mine');
    if (!response.ok) return { notifications: [], unreadCount: 0 };

    const data = await response.json();
    return { notifications: data.notifications, unreadCount: data.unreadCount };
};

export const markNotificationRead = async (id) => {
    const response = await apiFetch(`/notification/${id}/read`, { method: 'PATCH' });
    if (!response.ok) throw new Error("Couldn't update that notification.");
};

export const markAllNotificationsRead = async () => {
    const response = await apiFetch('/notification/read-all', { method: 'PATCH' });
    if (!response.ok) throw new Error("Couldn't mark notifications as read.");
};
