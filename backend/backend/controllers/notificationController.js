import Notification from '../models/notification.js';

export const getNotificationsByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const notifications = await Notification.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
};

export const createNotification = async (req, res) => {
  const { studentId, message, type } = req.body;
  try {
    const note = await Notification.create({ studentId, message, type });
    res.status(201).json({ message: 'Notification created', note });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create notification', error: err.message });
  }
};
