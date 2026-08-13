const Movie = require('../model/movieModel');
const Series = require('../model/seriesModel');

/**
 * Refuses to delete a person who is still credited on something.
 *
 * A title's `director` is required by the schema, so removing one out from
 * under it leaves a reference pointing at nothing — and a document that can
 * no longer satisfy its own model. The public page then renders whatever the
 * component does with a null, which is how deleting a credited director used
 * to take every one of their film pages down.
 *
 * Cast and composer references are not required, so they degrade rather than
 * break, but they are refused on the same terms: a credit silently vanishing
 * from titles the admin was not looking at is not something to do quietly.
 * The answer is to detach the person from those titles first, which is a
 * deliberate edit per title rather than a side effect of one click here.
 */
const countCredits = async (field, personId) => {
    const match = { [field]: personId };

    const [movies, series] = await Promise.all([
        Movie.countDocuments(match),
        Series.countDocuments(match),
    ]);

    return { movies, series, total: movies + series };
};

//! how each role is named on a movie/series document
const CREDIT_FIELD = {
    actor: 'actors',
    director: 'director',
    musician: 'musician',
};

/**
 * Returns a ready-to-send 409 payload when the person is still credited, or
 * null when they are safe to delete.
 */
const blockIfCredited = async (role, personId) => {
    const credits = await countCredits(CREDIT_FIELD[role], personId);
    if (!credits.total) return null;

    const parts = [];
    if (credits.movies) parts.push(`${credits.movies} film${credits.movies === 1 ? '' : 's'}`);
    if (credits.series) parts.push(`${credits.series} series`);

    return {
        status: 409,
        message: `Still credited on ${parts.join(' and ')}. Remove them from those titles first.`,
        credits,
    };
};

module.exports = { blockIfCredited, countCredits };
