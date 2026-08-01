import { apiFetch } from "./apiClient";

export const likeApi = async (media) => {
    try {
        await apiFetch('/like/like', {
            method: "POST",
            body: JSON.stringify({ media }),
        });
    } catch (error) {
        console.error(error);
    }
}


export const unlikeApi = async (media) => {
    try {
        await apiFetch('/like/unlike', {
            method: "POST",
            body: JSON.stringify({ media }),
        });
    } catch (error) {
        console.error(error);
    }
}


export const likeStatusApi = async (userId, media) => {
    try {
        const response = await apiFetch(`/like/status/${userId}/${media}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}
