import { apiFetch } from "./apiClient";

//! the API answers validation errors with an array of joi messages and
//! everything else with a single string — collapse both into one line the
//! form can show without caring which happened
const asMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    const { message } = data;

    if (Array.isArray(message)) return message[0];
    return message || fallback;
};

export const forgotPassword = async (email) => {
    const response = await apiFetch('/user/forgotPassword', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error(response.status === 500
            ? "Server error! Please try again later."
            : "Something went wrong! Please try again.");
    }
};

export const resetPassword = async (token, password) => {
    const response = await apiFetch(`/user/resetPassword/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password. Please try again.");
    }
};


//? Profile
export const fetchOverview = async () => {
    const response = await apiFetch('/user/me/overview');
    if (!response.ok) throw new Error(await asMessage(response, "Couldn't load your account."));

    const data = await response.json();
    return data.overview;
};

export const updateProfile = async (payload) => {
    const response = await apiFetch('/user/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await asMessage(response, "Couldn't save your changes."));

    const data = await response.json();
    return data.user;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await apiFetch('/user/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) throw new Error(await asMessage(response, "Couldn't change your password."));
};

export const logout = async () => {
    const response = await apiFetch('/user/logout', { method: 'POST' });
    if (!response.ok) throw new Error("Couldn't sign you out. Please try again.");
};


//? Watchlist
export const fetchWatchList = async () => {
    const response = await apiFetch('/user/watchList');
    if (!response.ok) throw new Error(await asMessage(response, "Couldn't load your watchlist."));

    const data = await response.json();
    return data.watchList;
};

export const addToWatchList = async (kind, item) => {
    const response = await apiFetch('/user/watchList', {
        method: 'POST',
        body: JSON.stringify({ kind, item }),
    });

    if (!response.ok) throw new Error(await asMessage(response, "Couldn't add that to your watchlist."));

    const data = await response.json();
    return data.added;
};

export const removeFromWatchList = async (itemId) => {
    const response = await apiFetch(`/user/watchList/${itemId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await asMessage(response, "Couldn't remove that from your watchlist."));
};

export const watchListStatus = async (itemId) => {
    try {
        const response = await apiFetch(`/user/watchList/${itemId}`);
        if (!response.ok) return false;

        const data = await response.json();
        return data.saved;
    } catch (error) {
        //! a failed status check just means the button starts unsaved
        return false;
    }
};
