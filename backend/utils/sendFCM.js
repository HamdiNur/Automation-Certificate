// 📁 utils/sendFCM.js
import admin from '../config/firebase.js';
export const sendFCM = async (fcmToken, title, body) => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
    });

    console.log('✅ FCM notification sent to:', fcmToken);
  } catch (error) {
    console.error('❌ FCM error:', error.message);
  }
};
