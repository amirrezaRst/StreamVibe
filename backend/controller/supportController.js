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




//! Create a new support ticket
exports.createSupportTicket = async (req, res) => {
    try {
        const support = await Support.create(req.body);

        res.status(201).send({ message: 'Support ticket created successfully', support });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
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