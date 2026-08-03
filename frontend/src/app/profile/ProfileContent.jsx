"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import { BookmarkIcon, HeartIcon } from "@/assets/Svgs";
import { fetchMyLikes, unlikeApi } from "@/services/LikeService";
import { fetchOverview, fetchWatchList, logout, removeFromWatchList } from "@/services/UserService";
import useUserStore from "@/stores/useUserStore";

import AccountPanel from "@/components/profile/AccountPanel";
import BookingsPanel from "@/components/profile/BookingsPanel";
import LibraryPanel from "@/components/profile/LibraryPanel";
import PanelSkeleton from "@/components/profile/PanelSkeleton";
import ProfileSidebar, { PROFILE_TABS } from "@/components/profile/ProfileSidebar";
import TicketsPanel from "@/components/profile/TicketsPanel";

const HEADINGS = {
    account: { title: "Account Info", subtitle: "Manage your personal details and password." },
    watchlist: { title: "Watchlist", subtitle: "Movies and series you saved to watch later." },
    liked: { title: "Liked", subtitle: "Everything you have liked, in one place." },
    bookings: { title: "My Bookings", subtitle: "Cinema seats you reserved, past and upcoming." },
    tickets: { title: "My Tickets", subtitle: "Track the status of requests you sent to our team." },
};

const TAB_IDS = PROFILE_TABS.flatMap(group => group.items.map(item => item.id));

const ProfileContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const user = useUserStore((state) => state.user);
    const loadingUser = useUserStore((state) => state.loading);
    const clearUser = useUserStore((state) => state.clearUser);

    const [overview, setOverview] = useState(null);
    const [signingOut, setSigningOut] = useState(false);

    //! the tab lives in the URL so a profile section can be linked to and
    //! survives a refresh; an unknown value falls back rather than blanking
    const requestedTab = searchParams.get("tab");
    const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "account";

    useEffect(() => {
        //! signing out clears the store a beat before the push to "/" lands;
        //! without this guard the guard itself would win the race and drop the
        //! user on the login screen instead of the homepage they asked for
        if (!loadingUser && !user && !signingOut) {
            router.replace("/register?page=login");
        }
    }, [loadingUser, user, signingOut, router]);

    useEffect(() => {
        if (!user) return;

        fetchOverview()
            .then(setOverview)
            .catch(() => {
                //! the counts are decoration; a failure here shouldn't stop
                //! anyone from reaching their bookings
            });
    }, [user]);

    const selectTab = (tab) => router.replace(`/profile?tab=${tab}`, { scroll: false });

    const adjustCount = useCallback((key, delta) => {
        setOverview(current => current && ({
            ...current,
            counts: { ...current.counts, [key]: Math.max(0, current.counts[key] + delta) },
        }));
    }, []);

    const onWatchlistRemove = useCallback((media) => removeFromWatchList(media._id), []);
    const onLikeRemove = useCallback((media) => unlikeApi(media._id), []);
    const onWatchlistCount = useCallback((delta) => adjustCount("watchList", delta), [adjustCount]);
    const onLikeCount = useCallback((delta) => adjustCount("likes", delta), [adjustCount]);

    const emptyStates = useMemo(() => ({
        watchlist: {
            icon: BookmarkIcon,
            title: "Your watchlist is empty",
            description: "Tap the bookmark on any movie or series to save it here for later.",
            actionLabel: "Browse Movies",
            actionHref: "/movies",
        },
        liked: {
            icon: HeartIcon,
            title: "Nothing liked yet",
            description: "Like a title and it will be collected here so you can find it again.",
            actionLabel: "Browse Movies",
            actionHref: "/movies",
        },
    }), []);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await logout();
            clearUser();
            router.push("/");
            toast.success("You have been signed out.");
        } catch (error) {
            toast.error(error.message);
            setSigningOut(false);
        }
    };

    if (loadingUser || !user) {
        return (
            <div className="container py-9">
                <div className="h-6 w-48 rounded bg-c-black-12 animate-pulse mb-6" />
                <PanelSkeleton count={4} />
            </div>
        );
    }

    const heading = HEADINGS[activeTab];

    return (
        <div className="container lg:py-9 py-5">
            <div className="flex lg:flex-row flex-col items-start gap-5 lg:gap-8">
                <ProfileSidebar
                    user={user}
                    counts={overview?.counts}
                    activeTab={activeTab}
                    onSelect={selectTab}
                    onSignOut={handleSignOut}
                    signingOut={signingOut}
                />

                <div className="flex-1 min-w-0 w-full">
                    <div className="mb-6">
                        <h1 className="text-[21px] font-extrabold text-c-grey-95 tracking-tight mb-1">{heading.title}</h1>
                        <p className="text-c-grey-60 text-sm">{heading.subtitle}</p>
                    </div>

                    {activeTab === "account" && <AccountPanel user={user} overview={overview} />}

                    {activeTab === "watchlist" && (
                        <LibraryPanel
                            //! key by tab so switching between the two grids remounts
                            //! rather than showing the previous list while loading
                            key="watchlist"
                            loader={fetchWatchList}
                            onRemove={onWatchlistRemove}
                            onCountChange={onWatchlistCount}
                            removeLabel="Remove from watchlist"
                            empty={emptyStates.watchlist}
                        />
                    )}

                    {activeTab === "liked" && (
                        <LibraryPanel
                            key="liked"
                            liked
                            loader={fetchMyLikes}
                            onRemove={onLikeRemove}
                            onCountChange={onLikeCount}
                            removeLabel="Unlike"
                            empty={emptyStates.liked}
                        />
                    )}

                    {activeTab === "bookings" && <BookingsPanel />}
                    {activeTab === "tickets" && <TicketsPanel />}
                </div>
            </div>
        </div>
    );
}

export default ProfileContent;
