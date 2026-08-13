import { create } from 'zustand';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/NotificationService';

const useNotificationStore = create(
    (set, get) => ({
        notifications: [],
        unreadCount: 0,
        loading: true,

        fetchAll: async () => {
            const { notifications, unreadCount } = await fetchNotifications();
            set({ notifications, unreadCount, loading: false });
        },

        //! optimistic — the read state is purely cosmetic (an unread dot), so
        //! there's nothing worth blocking the UI on a round-trip for
        markOneRead: (id) => {
            const wasUnread = get().notifications.find(n => n._id === id && !n.read);
            set((state) => ({
                notifications: state.notifications.map(n => n._id === id ? { ...n, read: true } : n),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            }));
            if (wasUnread) markNotificationRead(id).catch(() => { });
        },

        markAllRead: () => {
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0,
            }));
            markAllNotificationsRead().catch(() => { });
        },

        clearNotifications: () => set({ notifications: [], unreadCount: 0, loading: true }),
    })
);

export default useNotificationStore;
