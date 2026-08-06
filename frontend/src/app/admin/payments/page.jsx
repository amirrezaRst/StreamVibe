import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Payments" };

const PaymentsPage = () => (
    <NotBuiltYet
        title="Payments"
        crumbs={[{ label: "Box office" }]}
        describes="Charges and refunds through the gateway"
    />
);

export default PaymentsPage;
