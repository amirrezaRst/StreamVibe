import { Suspense } from "react";
import ProfileContent from "./ProfileContent";

export const metadata = {
    title: "Your Profile",
    description: "Manage your StreamVibe account, watchlist, cinema bookings and support tickets.",
    //! nothing here is meaningful to a crawler, and it all sits behind a login
    robots: { index: false, follow: false },
};

//! useSearchParams inside ProfileContent needs a boundary, or the whole route
//! is forced out of static rendering at build time
const ProfilePage = () => (
    <main>
        <Suspense>
            <ProfileContent />
        </Suspense>
    </main>
);

export default ProfilePage;
