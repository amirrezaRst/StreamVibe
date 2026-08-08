const { isValidObjectId } = require('mongoose');

/**
 * Public detail routes address records by slug (`/movie/inception`), but every
 * link, booking and review created before slugs existed carries an _id — and
 * so does the whole admin console, where a stable identifier matters more than
 * a readable one. So both are accepted: an ObjectId-shaped param is looked up
 * by _id, anything else by slug.
 *
 * Resolving here rather than in each controller also fixes a real crash: the
 * old ValidateObjectId rejected any non-ObjectId with a 400 before the handler
 * ran, which is what a cast link carrying a short public code hit.
 *
 * The resolved document is attached to `req` so a handler can skip re-fetching
 * it, and the route param is rewritten to the real _id. That rewrite is what
 * keeps this migration non-breaking: handlers and aggregation pipelines that
 * still read `req.params.id` go on working unchanged, they just now receive an
 * _id whichever form the caller used.
 */
const resolveBySlug = (Model, { param = 'id', as = 'record' } = {}) => async (req, res, next) => {
    const key = req.params[param];

    if (!key) return res.status(400).json({ status: 400, message: 'Missing identifier' });

    try {
        const record = await Model.findOne(isValidObjectId(key) ? { _id: key } : { slug: key });
        if (!record) {
            return res.status(404).json({ status: 404, message: `${Model.modelName} not found` });
        }

        req[as] = record;
        req.params[param] = String(record._id);
        next();
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = resolveBySlug;
