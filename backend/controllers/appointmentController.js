// 📁 controllers/appointmentController.js
import Appointment from '../models/appointment.js';
import Student from '../models/Student.js';
import Notification from '../models/notification.js';
import { sendFCM } from '../utils/sendFCM.js';

export const createAppointment = async (req, res) => {
  const { studentId, appointmentDate } = req.body;
  try {
    const existing = await Appointment.findOne({ studentId });
    if (existing) return res.status(400).json({ message: 'Appointment already exists.' });

    const appointment = await Appointment.create({
      studentId,
      appointmentDate: new Date(appointmentDate),
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Appointment created.', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const rescheduleAppointment = async (req, res) => {
  const { studentId, newDate, reason } = req.body;

  try {
    const appointment = await Appointment.findOne({ studentId });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const parsedNewDate = new Date(newDate);
    const today = new Date();

    // Prevent rescheduling to past dates
    if (parsedNewDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: 'Please enter a valid future date.',
      });
    }

    // 1. Update appointment
    appointment.appointmentDate = parsedNewDate;
    appointment.rescheduleReason = reason;
    appointment.rescheduled = true;
    appointment.status = 'rescheduled';
    await appointment.save();

    // 2. Prepare notification message
    const message = `Your appointment has been rescheduled to ${newDate}.`;

    // 3. Save notification in MongoDB
    await Notification.create({
      studentId,
      message,
      type: 'appointment',
      isRead: false,
    });

    // 4. Send push notification (FCM)
    const student = await Student.findById(studentId);
    console.log("Student token is:", student?.fcmToken);

    if (student?.fcmToken) {
      await sendFCM(student.fcmToken, '📅 Appointment Rescheduled', message);
    }

    res.status(200).json({ message: 'Rescheduled and student notified.', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const checkInAppointment = async (req, res) => {
  const { studentId } = req.body;
  const adminId = req.user?._id;

  try {
    const appointment = await Appointment.findOne({ studentId });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const today = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);

    if (today.toDateString() !== appointmentDate.toDateString()) {
      return res.status(400).json({
        message: 'You cannot check in before your appointment date.',
      });
    }

    appointment.checkedIn = true;
    appointment.attendedAt = today;
    appointment.status = 'completed';
    appointment.checkedInBy = adminId;

    await appointment.save();

    res.status(200).json({ message: 'Check-in successful.', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const record = await Appointment.findOne({ studentId }).populate('studentId');
    if (!record) return res.status(404).json({ message: 'Not found.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const list = await Appointment.find()
      .populate('studentId')
      .populate('checkedInBy', 'fullName');
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
