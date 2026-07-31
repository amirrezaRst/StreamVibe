const express = require('express');

const { getAllSupportTickets, createSupportTicket, getSupportTicketById, updateSupportTicket, deleteSupportTicket }
    = require('../controller/supportController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const Authorize = require('../middleware/Authorize');
const { createSupportTicketValidation, updateSupportTicketValidation } = require('../validation/supportValidation');

const router = express.Router();


router.route("/")
    .get([Authenticate, Authorize(["admin"])], getAllSupportTickets)
    .post(createSupportTicketValidation, createSupportTicket);

router.route("/:id")
    .get(ValidateObjectId, getSupportTicketById)
    .put([Authenticate, Authorize(["admin"]), updateSupportTicketValidation], ValidateObjectId, updateSupportTicket)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteSupportTicket);

module.exports = router;