import { apiFetch } from "./apiClient";

export const fetchMusician = async (slug) => {
    try {
        const response = await apiFetch(`/musician/${slug}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching musician:", error);
    }
}

export const fetchMusicianMovies = async (musicianId, currentPage, page) => {
    try {
        const response = await apiFetch(`/musician/moviesList/${musicianId}?page=${currentPage || page}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching musician movies:", error);
    }
}

export const fetchMusicianSeries = async (musicianId, currentPage, page) => {
    try {
        const response = await apiFetch(`/musician/seriesList/${musicianId}?page=${currentPage || page}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching musician series:", error);
    }
}
