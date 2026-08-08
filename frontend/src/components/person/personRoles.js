import { CameraIcon, MusicIcon, UserCircleIcon } from "@/assets/Svgs";

/**
 * Everything that differs between an actor page, a director page and a
 * composer page — which is only the wording, the icon and the URL segment.
 *
 * The three pages used to be separate copies of one another, which is how the
 * actor page ended up linking to /directors/, calling actors directors, and
 * printing a hardcoded name in place of the person being viewed. With the role
 * as data there is nothing left to forget to rename.
 */
export const ROLES = {
    actor: {
        label: "Actor",
        Icon: UserCircleIcon,
        segment: "actors",
        //! how each role relates to a title, used in the empty states and in
        //! the fallback description a search result shows
        films: (name) => `Films starring ${name}`,
        series: (name) => `Series starring ${name}`,
        noFilms: "No films for this actor in the catalogue yet.",
        noSeries: "No series for this actor in the catalogue yet.",
        collaboratorLabel: "Directors worked with",
        collaboratorKind: "director",
    },
    director: {
        label: "Director",
        Icon: CameraIcon,
        segment: "directors",
        films: (name) => `Films directed by ${name}`,
        series: (name) => `Series directed by ${name}`,
        noFilms: "No films for this director in the catalogue yet.",
        noSeries: "No series for this director in the catalogue yet.",
        collaboratorLabel: "Cast worked with",
        collaboratorKind: "actor",
    },
    musician: {
        label: "Composer",
        Icon: MusicIcon,
        segment: "musicians",
        films: (name) => `Films scored by ${name}`,
        series: (name) => `Series scored by ${name}`,
        noFilms: "No films scored by this composer in the catalogue yet.",
        noSeries: "No series scored by this composer in the catalogue yet.",
        collaboratorLabel: "Cast worked with",
        collaboratorKind: "actor",
    },
};
