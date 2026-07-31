import { create } from 'zustand';
import { apiFetch } from '@/services/apiClient';

const useUserStore = create(
    (set) => ({
        user: null,
        loading: false,
        error: null,
        fetchUser: async () => {
            set({ loading: true, error: null });
            try {
                const response = await apiFetch('/user/userData');
                const data = await response.json();
                set({ user: data.user, loading: false });
            } catch (error) {
                console.log(error)
                set({ error: error.message, loading: false });
            }
        },
        clearUser: () => set({ user: null }),
    }
    ));

export default useUserStore;