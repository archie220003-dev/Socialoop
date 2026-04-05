import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username avatar')
      .populate('post', 'title') // just so we can show snippet maybe
      .sort({ createdAt: -1 })
      .limit(30);

    res.send(notifications);
  } catch (error) {
    console.error("FULL ERROR (getNotifications):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.send(notification);
  } catch (error) {
    console.error("FULL ERROR (markAsRead):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
    res.send({ success: true });
  } catch (error) {
    console.error("FULL ERROR (markAllAsRead):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};
