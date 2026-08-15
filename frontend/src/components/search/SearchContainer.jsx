"use client"
import { useState } from "react";
import SearchOverlay from "./SearchOverlay";
import SearchActorItem from "./SearchActorItem";
import SearchMovieItem from "./SearchMovieItem";
import SearchForm from "./SearchForm";
import SearchMovieItemSkeleton from "./SearchMovieItemSkeleton";
import { apiFetch } from "@/services/apiClient";
import { toast } from "react-toastify";

const SearchContainer = ({ isOpen, setIsOpen }) => {
    const [show, setShow] = useState(isOpen);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async (query) => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await apiFetch('/search/', {
                method: "POST",
                body: JSON.stringify({
                    query: query.trim(),
                }),
            });
            const data = await res.json();
            setSearchResults(data.results);
            setLoading(false);
            return data;
        } catch (error) {
            //! a failed search used to end here, logged to a console nobody has
            //! open: the overlay just sat empty and looked like "no results"
            //! for a query that was never actually run
            setLoading(false);
            setSearchResults([]);
            toast.error("Search is unavailable right now. Please try again.");
        };
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
        setSearchResults([]);
    }

    return (
        <SearchOverlay show={show} setShow={setShow} isOpen={isOpen}>
            <SearchForm query={query} setQuery={setQuery} handleClose={handleClose} handleSearch={handleSearch} />

            <div
                className="flex flex-col gap-6 mt-9 overflow-y-auto custom-scrollbar custom-scrollbar-sm pr-3 py-2 flex-1 border-y-2 border-y-c-black-20"
            >
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <SearchMovieItemSkeleton key={index} />
                    ))
                ) : (
                    searchResults?.map((item) => {
                        if (item.type === 'movie' || item.type === 'series') {
                            return <SearchMovieItem key={item._id} type={item.type} data={item.data} handleClose={handleClose} />;
                        } else if (item.type === 'actor' || item.type === 'director') {
                            return <SearchActorItem key={item._id} type={item.type} data={item.data} handleClose={handleClose} />;
                        }
                        return null;
                    })
                )}
            </div>
        </SearchOverlay>
    );
}

export default SearchContainer;