const { uniqueSlug } = require('../../utils/slug');

/**
 * Gives a schema a slug the moment a record is first saved, derived from
 * whichever field names it (`title` for a film, `fullName` for a person).
 *
 * This lives on the schema rather than in the create controllers so that
 * every path that makes a record — the admin console, the seed scripts, a
 * controller written next year — produces one. A record that reached the
 * database without a slug would be unreachable at its public URL, and nothing
 * would report it.
 *
 * Existing slugs are never recomputed: renaming a film must not move its
 * address out from under links that already point at it.
 */
const slugPlugin = (schema, { source, year } = {}) => {
    schema.pre('save', async function generateSlug(next) {
        if (this.slug) return next();

        try {
            this.slug = await uniqueSlug(this.constructor, this[source], {
                year: year ? this[year] : undefined,
                excludeId: this._id,
            });
            next();
        } catch (error) {
            next(error);
        }
    });
};

module.exports = slugPlugin;
