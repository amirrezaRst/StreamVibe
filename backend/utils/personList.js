/**
 * Backs the /actors, /directors and /musicians browse pages — search and
 * pagination are identical across all three person models, so this is one
 * factory instead of three copies, the same way personCredits.js is shared.
 */
const paginatedPeople = (Model) => async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 24;
        const skip = (page - 1) * limit;
        const search = (req.query.search || '').trim();

        const filter = search ? { fullName: { $regex: search, $options: 'i' } } : {};

        const people = await Model.find(filter)
            .select('fullName slug profile country birthDate death_date')
            .collation({ locale: 'en', strength: 2 })
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Model.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            people,
            pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages, total },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = { paginatedPeople };
