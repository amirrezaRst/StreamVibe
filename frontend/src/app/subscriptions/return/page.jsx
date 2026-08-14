import { Suspense } from "react";

import { buildMetadata } from "@/utils/metadata";
import SubscriptionReturn from "./SubscriptionReturn";

export const metadata = buildMetadata({
    title: "Confirming your payment",
    path: "/subscriptions/return",
    index: false,
});

const SubscriptionReturnPage = () => (
    //! useSearchParams needs a Suspense boundary above it, or the whole route
    //! opts out of static rendering at build time
    <Suspense fallback={null}>
        <SubscriptionReturn />
    </Suspense>
);

export default SubscriptionReturnPage;
