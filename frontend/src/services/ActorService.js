import { apiFetch } from "./apiClient";

export const fetchActor = async (slug) => {
    try {
        const response = await apiFetch(`/actor/${slug}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching actor:", error);
    }
}

export const fetchActorSeries = async (actorId, currentPage, page) => {
    try {
        const response = await apiFetch(`/actor/seriesList/${actorId}?page=${currentPage || page}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching series:", error);
    }
}

export const fetchActorMovies = async (actorId, currentPage, page) => {
    try {
        const response = await apiFetch(`/actor/moviesList/${actorId}?page=${currentPage || page}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching series:", error);
    }
}
