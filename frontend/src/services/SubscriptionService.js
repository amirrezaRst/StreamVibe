export const handleActivateSubscription = async (id, freeTrial, time, plan) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/addSubscription/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
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