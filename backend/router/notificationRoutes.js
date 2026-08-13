const express = require('express');

const { getMyNotifications, markNotificationRead, markAllNotificationsRead } = require('../controller/notificationController');
const Authenticate = require('../middleware/Authenticate');
const ValidateObjectId = require('../middleware/ValidateObjectId');

const router = express.Router();

router.get('/mine', Authenticate, getMyNotifications);
router.patch('/read-all', Authenticate, markAllNotificationsRead);
router.patch('/:id/read', Authenticate, ValidateObjectId, markNotificationRead);

module.exports = router;
