import { apiFetch } from "./apiClient";

export const fetchDirector = async (slug) => {
    try {
        const response = await apiFetch(`/director/${slug}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching director:", error);
    }
}

export const fetchDirectorSeries = async (directorId, currentPage, page) => {
    try {
        const response = await apiFetch(`/director/seriesList/${directorId}?page=${currentPage || page}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching series:", error);
    }
}

export const fetchDirectorMovies = async (directorId, currentPage, page) => {
    try {
        const response = await apiFetch(`/director/moviesList/${directorId}?page=${currentPage || page}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching series:", error);
    }
}
