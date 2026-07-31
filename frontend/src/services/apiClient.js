const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiFetch = (path, options = {}) => {
    return fetch(`${BASE_URL}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
};
