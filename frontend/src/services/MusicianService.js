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

export const fetchMusicians = async (page, search) => {
    try {
        const query = new URLSearchParams({ page: page || 1, ...(search ? { search } : {}) });
        const response = await apiFetch(`/musician/browse?${query}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching musicians:", error);
    }
}
