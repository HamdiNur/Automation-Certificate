import Notification from '../models/notification.js';
import Student from '../models/Student.js';

export const getNotificationsByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    // 🔍 Step 1: Find student by string ID
    const student = await Student.findOne({ studentId });
    if (!student) {
      console.log(`❌ No student found for studentId: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log(`✅ Found student _id: ${student._id}`);

    // 📥 Step 2: Fetch notifications using ObjectId and sort by newest first
    const notifications = await Notification.find({ studentId: student._id }).sort({ createdAt: -1 });

    console.log(`📦 Found ${notifications.length} notifications`);
    return res.status(200).json(notifications);
    
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    return res.status(500).json({
      message: 'Failed to fetch notifications',
      error: err.message
    });
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

