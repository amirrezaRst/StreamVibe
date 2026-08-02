import { LikeIcon, LikeOutlineIcon } from "@/assets/Svgs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { likeApi, likeStatusApi, unlikeApi } from "../../services/LikeService";


const LikeButton = ({ userId, media }) => {
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //! signed out there is no status to fetch, and leaving `loading` set
        //! would render an empty, permanently disabled button
        if (!userId || !media) {
            setLoading(false);
            return;
        }

        likeStatusApi(userId, media).then((data) => {
            setLiked(data.liked);
            setLoading(false);
        });
    }, [userId, media]);

    const handleLike = () => {
        try {
            if (!userId && !media) {
                return;
            }
            else if (!userId) {
                toast.error("Please login to like this media");
                return;
            }

            if (liked === false) {
                likeApi(media).then(() => {
                    setLiked(true);
                }).catch(() => {
                    toast.error("An error occurred while trying to like this media");
                });
            }
            else if (liked === true) {
                unlikeApi(media).then(() => {
                    setLiked(false);
                }).catch(() => {
                    toast.error("An error occurred while trying to like this media");
                });
            }

        } catch (error) {
            toast.error("An error occurred while trying to like this media");
        }
    }

    return (
        <button
            className="xl:h-12 h-11 xl:w-12 w-11 bg-c-black-06 border border-c-black-15 rounded-md flex items-center justify-center"
            onClick={handleLike}
            disabled={loading}
        >
            {loading ? null : (liked ? <LikeIcon color="#E50000" /> : <LikeOutlineIcon />)}
        </button>
    );
}

export default LikeButton;