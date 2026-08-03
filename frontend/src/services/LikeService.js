import { apiFetch } from "./apiClient";

//! these used to swallow every failure, which left the heart flipped even when
//! the write never landed — callers already handle a rejection
export const likeApi = async (media) => {
    const response = await apiFetch('/like/like', {
        method: "POST",
        body: JSON.stringify({ media }),
    });

    if (!response.ok) throw new Error("Couldn't like this title. Please try again.");
}


export const unlikeApi = async (media) => {
    const response = await apiFetch('/like/unlike', {
        method: "POST",
        body: JSON.stringify({ media }),
    });

    if (!response.ok) throw new Error("Couldn't remove your like. Please try again.");
}


export const fetchMyLikes = async () => {
    const response = await apiFetch('/like/mine');
    if (!response.ok) throw new Error("Couldn't load the titles you've liked.");

    const data = await response.json();
    return data.media;
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
