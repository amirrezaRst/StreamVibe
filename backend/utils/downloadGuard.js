const { qualitiesUpTo } = require('../constants/plans');

/**
 * Checks the requested file against the plan's quality ceiling.
 *
 * The quality is looked up from the record that owns the file rather than read
 * off the request: the client knows which quality it asked for, but a client
 * is free to lie, and "Standard" would otherwise be one edited request away
 * from a 4K download.
 *
 * Returns null when the download is allowed, or an error payload to send back.
 */
const guardQuality = async (Model, url, entitlement) => {
    const allowed = qualitiesUpTo(entitlement.capabilities.maxQuality);

    const owner = await Model.findOne({ 'files.url': url }).select('files');
    //! nothing in the catalogue claims this file — refuse rather than guess.
    //! The path check in the handler stops traversal; this stops a valid-but-
    //! unlisted file in the videos directory being pulled down by URL alone.
    if (!owner) {
        return { status: 404, message: 'That file is not part of the StreamVibe catalogue.' };
    }

    const file = owner.files.find((entry) => entry.url === url);
    if (!allowed.includes(file.quality)) {
        return {
            status: 403,
            message: `${file.quality} downloads are not included in the ${entitlement.capabilities.label} plan.`,
            reason: 'quality_above_plan',
            maxQuality: entitlement.capabilities.maxQuality,
        };
    }

    return null;
};

module.exports = { guardQuality };
