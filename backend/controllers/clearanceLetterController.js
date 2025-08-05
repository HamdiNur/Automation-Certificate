import Student from '../models/Student.js';
import Appointment from '../models/appointment.js';

export const getClearanceLetterData = async (req, res) => {
  const { studentId } = req.params;

  try {
    console.log("📥 Incoming studentId (string):", studentId);

    // 1. Find the student using their studentId (string like "C1210229")
    const student = await Student.findOne({ studentId });
    if (!student) {
      console.log("❌ Student not found:", studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Use student._id (ObjectId) to query appointment
    console.log("🔍 Searching appointment using _id:", student._id);
    const appointment = await Appointment.findOne({ studentId: student._id });
    if (!appointment) {
      console.log("❌ Appointment not found for student:", student._id);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // 3. Return clearance letter data
    res.status(200).json({
      student: {
        name: student.fullName,
        studentId: student.studentId,
        faculty: student.faculty,
        program: student.program,
      },
      appointment: {
dateFormatted: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
  timeZone: 'Africa/Mogadishu',
  weekday: 'long',     // ✅ adds the day name like "Friday"
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}),        timeRange: "9:00 AM - 12:00 PM",
        location: "Examination Office"
      }
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({
      message: 'Server error occurred.',
      error: err.message,
    });
  }
};
