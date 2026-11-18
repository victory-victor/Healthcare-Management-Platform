const dbAdapter = require('../services/dbAdapter');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await dbAdapter.find('Notification', { user: userId }, { createdAt: -1 }, 30);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const updated = await dbAdapter.findByIdAndUpdate('Notification', req.params.id, { isRead: true });
    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await dbAdapter.findByIdAndDelete('Notification', req.params.id);
    res.status(200).json({ success: true, message: 'Notification removed.' });
  } catch (error) {
    next(error);
  }
};
