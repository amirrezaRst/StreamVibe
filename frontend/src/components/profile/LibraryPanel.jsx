"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import EmptyState from "./EmptyState";
import MediaCard from "./MediaCard";
import PanelSkeleton from "./PanelSkeleton";
import usePanelData from "./usePanelData";

/**
 * Watchlist and Liked are the same view of the same shape of data — a grid of
 * saved titles you can drop one at a time. Only the verb behind the corner
 * button and the wording differ, so they share one component.
 */
const LibraryPanel = ({ loader, onRemove, onCountChange, removeLabel, liked, empty }) => {
    const { items, error, loading, setItems } = usePanelData(loader);
    const [pendingId, setPendingId] = useState(null);

    const handleRemove = async (media) => {
        setPendingId(media._id);
        try {
            await onRemove(media);

            setItems(current => current.filter(entry => entry._id !== media._id));
            onCountChange(-1);
            toast.success(`Removed "${media.title}".`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setPendingId(null);
        }
    };

    if (loading) return <PanelSkeleton variant="grid" count={8} />;
    if (error) return <p className="text-c-grey-60 text-super-sm">{error}</p>;
    if (!items.length) return <EmptyState {...empty} />;

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-[18px]">
            {items.map(media => (
                <MediaCard
                    key={media._id}
                    media={media}
                    liked={liked}
                    removeLabel={removeLabel}
                    removing={pendingId === media._id}
                    onRemove={() => handleRemove(media)}
                />
            ))}
        </div>
    );
}

export default LibraryPanel;
