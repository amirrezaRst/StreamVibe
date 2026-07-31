import { apiFetch } from "./apiClient";

export const handleActivateSubscription = async (id, freeTrial, time, plan) => {
    try {
        const response = await apiFetch(`/user/addSubscription/${id}`, {
            method: "POST",
            body: JSON.stringify({ freeTrial, time, plan })
        });

        const data = await response.json();
    } catch (error) {
        console.log(error);
    };
};


export const checkSubscriptionStatus = (user) => {
    return user?.subscription?.status === "active";
};
