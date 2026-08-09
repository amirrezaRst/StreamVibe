import { apiFetch } from "./apiClient";

export const fetchSpotlight = async () => {
    try {
        const response = await apiFetch("/spotlight");
        const data = await response.json();
        return data.slides || [];
    } catch (error) {
        console.error("Error fetching spotlight:", error);
        return [];
    }
}
