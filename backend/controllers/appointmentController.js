// 📁 controllers/appointmentController.js
import Appointment from '../models/appointment.js';
import Student from '../models/Student.js';
import Notification from '../models/notification.js';
//import { sendFCM } from '../utils/sendFCM.js';
import { notifyStudent } from '../services/notificationService.js'; // ✅ Make sure this is correctly imported

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
    global._io.emit("appointment:created", {
  studentId,
  appointmentDate: appointment.appointmentDate,
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

    if (parsedNewDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: 'Please enter a valid future date.',
      });
    }

    // Update appointment
    appointment.appointmentDate = parsedNewDate;
    appointment.rescheduleReason = reason;
    appointment.rescheduled = true;
    appointment.status = 'rescheduled';
    await appointment.save();
    await appointment.save();

global._io.emit("appointment:rescheduled", {
  studentId,
  newDate: appointment.appointmentDate,
  reason,
});

    const student = await Student.findById(studentId);
    const message = `Your appointment has been rescheduled to ${newDate}. Reason: ${reason}`;

    await notifyStudent({
      student,
      title: '📅 Appointment Rescheduled',
      message,
      type: 'appointment',
    });

    console.log("Student token is:", student?.fcmToken); // ✅ FIXED typo

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

    // Compare only date (ignore time) and block check-in before appointment date
    if (today.setHours(0, 0, 0, 0) < appointmentDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: 'You cannot check in before your appointment date.',
      });
    }

    appointment.checkedIn = true;
    appointment.attendedAt = today;
    appointment.status = 'completed';
    appointment.checkedInBy = adminId;

    await appointment.save();
    global._io.emit("appointment:checked-in", {
  studentId,
  attendedAt: appointment.attendedAt,
  checkedInBy: appointment.checkedInBy,
});
    console.log("✅ Saved Appointment:", appointment);

    res.status(200).json({ message: 'Check-in successful.', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentByStudent = async (req, res) => {
  const studentCode = req.params.studentId;

  try {
    console.log("🔍 Looking up student with studentId (code):", studentCode);

    // Step 1: Find student by string code
    const student = await Student.findOne({ studentId: studentCode });
    if (!student) {
      console.log("❌ Student not found for:", studentCode);
      return res.status(404).json({ message: 'Student not found.' });
    }

    console.log("✅ Found student _id:", student._id);

    // Step 2: Find appointment by ObjectId
    const appointment = await Appointment.findOne({ studentId: student._id }).populate('studentId');
    if (!appointment) {
      console.log("❌ Appointment not found for student:", student._id);
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    console.log("✅ Appointment found:", appointment.appointmentDate);
    res.status(200).json(appointment);

  } catch (err) {
    console.error("❌ ERROR in getAppointmentByStudent:", err.message);
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

// ✅ Get appointment status summary for a single student
export const getAppointmentStatusByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const appointment = await Appointment.findOne({ studentId });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found for this student." });
    }

    const status = {
      studentId: appointment.studentId,
      appointmentDate: appointment.appointmentDate,
      checkedIn: appointment.checkedIn,
      rescheduled: appointment.rescheduled || false,
      rescheduleReason: appointment.rescheduleReason || null,
      status: appointment.status || "pending",
      attendedAt: appointment.attendedAt || null,
    };

    res.status(200).json(status);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointment status.", error: err.message });
  }
};
