import NotBuiltYet from "@/components/admin/NotBuiltYet";

export const metadata = { title: "Users" };

const UsersPage = () => (
    <NotBuiltYet
        title="Users"
        crumbs={[{ label: "Community" }]}
        describes="Accounts and their roles"
    />
);

export default UsersPage;
