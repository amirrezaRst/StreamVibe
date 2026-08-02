const express = require('express');

const { getAllSupportTickets, getMySupportTickets, createSupportTicket, getSupportTicketById, updateSupportTicket, deleteSupportTicket }
    = require('../controller/supportController');
const ValidateObjectId = require('../middleware/ValidateObjectId');
const Authenticate = require('../middleware/Authenticate');
const AttachUser = require('../middleware/AttachUser');
const Authorize = require('../middleware/Authorize');
const { createSupportTicketValidation, updateSupportTicketValidation } = require('../validation/supportValidation');

const router = express.Router();


router.route("/")
    .get([Authenticate, Authorize(["admin"])], getAllSupportTickets)
    .post([AttachUser, createSupportTicketValidation], createSupportTicket);

//! must stay above "/:id", or an id-shaped route would swallow it
router.get("/mine", Authenticate, getMySupportTickets);

router.route("/:id")
    .get(ValidateObjectId, getSupportTicketById)
    .put([Authenticate, Authorize(["admin"]), updateSupportTicketValidation], ValidateObjectId, updateSupportTicket)
    .delete([Authenticate, Authorize(["admin"])], ValidateObjectId, deleteSupportTicket);

module.exports = router;