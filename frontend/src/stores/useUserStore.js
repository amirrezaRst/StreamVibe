import { create } from 'zustand';
import { apiFetch } from '@/services/apiClient';

const useUserStore = create(
    (set) => ({
        user: null,
        //! what the signed-in user is actually entitled to watch and download.
        //! Resolved server-side rather than derived from `user.subscription`
        //! here, because that is also where a lapsed plan gets expired — a
        //! client reading the raw status could act on a stale 'active'
        entitlement: null,
        //! starts true because MainLayout calls fetchUser on mount: until that
        //! lands, "no user" means "not known yet", not "signed out"
        loading: true,
        error: null,
        fetchUser: async () => {
            set({ loading: true, error: null });
            try {
                const response = await apiFetch('/user/userData');
                const data = await response.json();
                set({ user: data.user, entitlement: data.entitlement ?? null, loading: false });
            } catch (error) {
                console.log(error)
                set({ error: error.message, loading: false });
            }
        },
        clearUser: () => set({ user: null, entitlement: null }),
    }
    ));

export default useUserStore;