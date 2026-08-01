import { apiFetch } from "./apiClient";

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
