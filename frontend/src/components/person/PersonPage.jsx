import CreditCarousel from "./CreditCarousel";
import KnownFor from "./KnownFor";
import PersonAside from "./PersonAside";
import PersonBiography from "./PersonBiography";
import PersonHero from "./PersonHero";
import { ROLES } from "./personRoles";

/**
 * One layout for actors, directors and composers.
 *
 * These were three routes' worth of duplicated markup, and four of the five
 * bugs found on them existed only because of that duplication: the actor page
 * linked to /directors/, called actors directors in its empty state and its
 * alt text, and every director page printed a hardcoded "Christopher Nolan"
 * instead of the person being viewed. With one component and the role as data,
 * there is a single empty state, a single link builder and a single alt text.
 */
const PersonPage = ({ roleKey, person, movies = [], series = [], collaborators = [] }) => {
    const role = ROLES[roleKey];
    const address = person.slug || person._id;
    const credits = [...movies, ...series];

    //! the hero tints itself with the first credit's poster; someone with no
    //! credits simply gets the plain panel
    const backdrop = credits[0]?.thumbnail
        ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${credits[0].thumbnail}`
        : null;

    return (
        <main className="container md:pt-10 pt-5 md:pb-20 pb-10">
            <PersonHero
                person={{ ...person, profile: `${process.env.NEXT_PUBLIC_IMAGE_URL}/${person.profile}` }}
                role={role}
                backdrop={backdrop}
            />

            <div className="grid grid-cols-12 xl:gap-6 gap-4 mt-5">
                <div className="lg:col-span-8 col-span-12 flex flex-col gap-4">
                    <KnownFor credits={credits} />
                    <PersonBiography bio={person.bio} fullName={person.fullName} />
                </div>

                <div className="lg:col-span-4 col-span-12">
                    <PersonAside person={person} role={role} collaborators={collaborators} />
                </div>
            </div>

            <CreditCarousel
                heading={role.films(person.fullName)}
                seeAllHref={`/${role.segment}/${address}/movies`}
                credits={movies}
                emptyNote={role.noFilms}
            />

            <CreditCarousel
                series
                heading={role.series(person.fullName)}
                seeAllHref={`/${role.segment}/${address}/series`}
                credits={series}
                emptyNote={role.noSeries}
            />
        </main>
    );
}

export default PersonPage;
