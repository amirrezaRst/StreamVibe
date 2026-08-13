const Notification = require('../model/notificationModel');

//! Get the signed-in user's own notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30),
            Notification.countDocuments({ user: req.user.id, read: false }),
        ]);

        res.status(200).json({ status: 200, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: 404, message: 'Notification not found' });
        }

        res.status(200).json({ status: 200, notification });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
        res.status(200).json({ status: 200, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
