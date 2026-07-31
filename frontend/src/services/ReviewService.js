export const fetchReviews = async (id) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${id}`);
    const data = await response.json();
    return data.reviews;
}


export const addNewReview = async (data) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(response.status === 500
            ? "Server error! Please try again later."
            : "Failed to Add Preview! Please try again later.");
    }
}