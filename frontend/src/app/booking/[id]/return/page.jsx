import { Suspense } from "react";
import PaymentReturn from "./PaymentReturn";

export const metadata = {
    title: "Confirming your payment",
    robots: { index: false, follow: false },
};

const PaymentReturnPage = ({ params }) => (
    <Suspense>
        <PaymentReturn id={params.id} />
    </Suspense>
);

export default PaymentReturnPage;
