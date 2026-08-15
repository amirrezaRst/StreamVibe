const MovieItemThumbnail = ({ src, title }) => {
    return (
        <img
            src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${src}`}
            alt={title}
            className="w-52 h-60 object-cover object-top rounded-xl border-2 border-c-black-15"
        />
    );
}

export default MovieItemThumbnail;