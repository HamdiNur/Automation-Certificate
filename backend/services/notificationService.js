// 📁 services/notificationService.js
import admin from '../config/firebase.js';
import Notification from '../models/notification.js';

/**
 * Send a notification to the student (Push + Save to DB)
 * 
 * @param {Object} options
 * @param {Object} options.student - Student document
 * @param {string} options.title - Notification title
 * @param {string} options.message - Body message
 * @param {string} [options.type='general'] - Type for DB (optional)
 */
export async function notifyStudent({ student, title, message, type = 'general' }) {
  if (!student) return console.warn('❗ No student object provided.');
  
  // Save to DB
  await Notification.create({
    studentId: student._id,
   title, // ✅ Add this line

    message,
    type,
    isRead: false,
  });

  // Send FCM push
  if (student.fcmToken) {
    try {
      await admin.messaging().send({
        token: student.fcmToken,
        notification: { title, body: message },
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      console.log(`✅ Notification sent to ${student.studentId}`);
    } catch (err) {
      console.error('❌ FCM send error:', err.message);
    }
  } else {
    console.warn(`⚠️ No FCM token for student ${student.studentId}`);
  }
}
