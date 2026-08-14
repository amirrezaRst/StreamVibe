import { apiFetch } from "./apiClient";

const asError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    const { message } = data;

    const error = new Error(Array.isArray(message) ? message[0] : message || fallback);
    error.status = response.status;
    return error;
};

/**
 * What each plan costs, from the server that will actually charge it.
 *
 * The prices used to live in a frontend constant while the server took the
 * client's word for which plan to switch on — so the page and the charge had
 * no common source at all. Reading them from the API is what keeps the number
 * someone is shown and the number they are billed the same one.
 */
export const fetchPlans = async () => {
    const response = await apiFetch("/subscription/plans");
    if (!response.ok) throw await asError(response, "Couldn't load the plans.");

    return response.json();
};

//! the browser names a plan and a cycle; the price, and everything else about
//! the charge, is decided server-side
export const startSubscriptionCheckout = async (plan, cycle) => {
    const response = await apiFetch("/subscription/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, cycle }),
    });

    if (!response.ok) throw await asError(response, "Couldn't start the payment.");

    return response.json();
};

export const verifySubscriptionPayment = async (sessionId) => {
    const response = await apiFetch("/subscription/verify", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) throw await asError(response, "Couldn't confirm the payment.");

    return response.json();
};

//! the free trial is the one plan that is genuinely free, so it stays a plain
//! activation rather than going through checkout
export const handleActivateSubscription = async (id, freeTrial, time, plan) => {
    const response = await apiFetch(`/user/addSubscription/${id}`, {
        method: "POST",
        body: JSON.stringify({ freeTrial, time, plan }),
    });

    if (!response.ok) throw await asError(response, "Couldn't activate that plan.");

    return response.json();
};

export const checkSubscriptionStatus = (user) => {
    return user?.subscription?.status === "active";
};
