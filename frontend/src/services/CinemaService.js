import { apiFetch } from "./apiClient";

export const fetchCities = async () => {
    try {
        const response = await apiFetch('/cinema/cities');
        if (!response.ok) throw new Error('Failed to fetch cities');

        const data = await response.json();
        return data.cities;
    } catch (error) {
        console.error("Error fetching cities:", error);
        return [];
    }
}

export const fetchCinemas = async (city) => {
    try {
        const query = city ? `?city=${encodeURIComponent(city)}` : '';
        const response = await apiFetch(`/cinema${query}`);
        if (!response.ok) throw new Error('Failed to fetch cinemas');

        const data = await response.json();
        return data.cinemas;
    } catch (error) {
        console.error("Error fetching cinemas:", error);
        return [];
    }
}

export const fetchShowtimesByMovie = async (movieId, { city, date } = {}) => {
    try {
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (date) params.set('date', date);

        const query = params.toString() ? `?${params}` : '';
        const response = await apiFetch(`/showtime/movie/${movieId}${query}`);
        if (!response.ok) throw new Error('Failed to fetch showtimes');

        return response.json();
    } catch (error) {
        console.error("Error fetching showtimes:", error);
        return { cinemas: [], total: 0 };
    }
}

export const fetchNowPlaying = async ({ city, limit } = {}) => {
    try {
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (limit) params.set('limit', limit);

        const query = params.toString() ? `?${params}` : '';
        const response = await apiFetch(`/showtime/now-playing${query}`);
        if (!response.ok) throw new Error('Failed to fetch now playing');

        const data = await response.json();
        return data.nowPlaying;
    } catch (error) {
        console.error("Error fetching now playing:", error);
        return [];
    }
}

export const fetchShowtime = async (showtimeId) => {
    const response = await apiFetch(`/showtime/${showtimeId}`);
    if (!response.ok) throw new Error('Failed to fetch showtime');

    return response.json();
}
