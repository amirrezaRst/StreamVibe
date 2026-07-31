import { apiFetch } from "./apiClient";

export const fetchMovieCategories = async () => {
    try {
        const response = await apiFetch('/movie/categories');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movie categories:', error);
        return [];
    }
};


export const fetchTopRatedCategories = async () => {
    const response = await apiFetch('/movie/top-rated?limit=4');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.movies;
}


export const getTrendingMovies = async (currentPage, page) => {
    try {
        const response = await apiFetch(`/movie/trending-movies?page=${currentPage || page || 1}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        return [];
    }
}

export const getNewReleasedMovies = async (currentPage, page) => {
    try {
        const response = await apiFetch(`/movie/new-released?page=${currentPage || page || 1}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching trending movies:", error);
    }
}

export const getPopularMovies = async (currentPage, page) => {
    try {
        const response = await apiFetch(`/movie/popular-movies?page=${currentPage || page || 1}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching trending movies:", error);
    }
}

export const fetchSingleMovies = async (slug) => {
    const res = await apiFetch(`/movie/${slug}`);
    const data = await res.json();
    return data;
}

export const downloadMovieApi = async (url) => {
    try {
        const response = await apiFetch('/movie/download', {
            method: 'POST',
            body: JSON.stringify({ url }),
        });
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error('Download error:', error);
    }
};


export const fetchGenreMovies = async (genre, currentPage, page, topRated) => {
    try {
        const response = await apiFetch(`/movie/moviesByGenre/${genre}?page=${currentPage || page || 1}&topRated=${topRated}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching genre movies:", error);
        return [];
    }
}
