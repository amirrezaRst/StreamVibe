import OverviewContent from "./OverviewContent";

//! absolute rather than "Overview": a title template does not apply to the
//! page sitting in the same segment as the layout that declares it, so this one
//! page would otherwise fall through to the public site's template and read
//! "· StreamVibe" while every other console screen reads "· StreamVibe Console"
export const metadata = { title: { absolute: "Overview · StreamVibe Console" } };

const AdminOverviewPage = () => <OverviewContent />;

export default AdminOverviewPage;
