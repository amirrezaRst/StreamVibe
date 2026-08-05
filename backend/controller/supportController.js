const Support = require('../model/supportModel');


//! Get all support tickets
exports.getAllSupportTickets = async (req, res) => {
    try {
        const supports = await Support.find();

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            results: supports.length,
            supports
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};

//! Get a single support ticket by ID
exports.getSupportTicketById = async (req, res) => {
    try {
        const support = await Support.findById(req.params.id);
        if (!support) {
            return res.status(404).json({
                status: 404,
                message: 'Support ticket not found',
            });
        }

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            support
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};




//! Get the signed-in user's own tickets
exports.getMySupportTickets = async (req, res) => {
    try {
        const supports = await Support.find({ user: req.user.id })
            .select("subject message status createdAt")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            results: supports.length,
            supports
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};


//! Create a new support ticket
exports.createSupportTicket = async (req, res) => {
    try {
        //! taken from the session rather than the body, so a ticket can't be
        //! filed under somebody else's account
        const support = await Support.create({ ...req.body, user: req.user ? req.user.id : null });

        res.status(201).send({ message: 'Support ticket created successfully', support });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};



/**
 * Move a ticket along without restating it. The full update requires the name
 * and subject back, which would mean the console echoing fields it is not
 * touching just to change one word.
 */
exports.setSupportStatus = async (req, res) => {
    try {
        const support = await Support.findByIdAndUpdate(
            req.params.id,
            { $set: { status: req.body.status } },
            { new: true, runValidators: true }
        );

        if (!support) {
            return res.status(404).json({ status: 404, message: 'Support ticket not found' });
        }

        res.status(200).json({
            status: 200,
            message: `Marked ${req.body.status}`,
            support,
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
};

//! Update a support ticket
exports.updateSupportTicket = async (req, res) => {
    try {
        const support = await Support.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!support) {
            return res.status(404).json({
                status: 404,
                message: 'Support ticket not found',
            });
        }
        res.status(200).json({
            status: 200,
            message: "Support ticket updated successfully",
            support
        })
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};

//! Delete a support ticket
exports.deleteSupportTicket = async (req, res) => {
    try {
        const support = await Support.findByIdAndDelete(req.params.id);
        if (!support) {
            return res.status(404).json({
                status: 404,
                message: 'Support ticket not found',
            });
        }
        res.status(200).json({
            status: 204,
            message: "Support ticket deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
};