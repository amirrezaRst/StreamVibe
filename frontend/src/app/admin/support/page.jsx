import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Support" };

const SupportPage = () => (
    <NotBuiltYet
        title="Support"
        crumbs={[{ label: "Community" }]}
        describes="The support inbox"
    />
);

export default SupportPage;
