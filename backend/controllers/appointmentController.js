import Appointment from '../models/appointment.js';

export const createAppointment = async (req, res) => {
  const { studentId, appointmentDate } = req.body;
  try {
    const existing = await Appointment.findOne({ studentId });
    if (existing) return res.status(400).json({ message: 'Appointment already exists.' });

    const appointment = await Appointment.create({
      studentId,
      appointmentDate: new Date(appointmentDate),
      createdBy: req.user._id
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
    if (!appointment) return res.status(404).json({ message: 'Not found.' });

    appointment.appointmentDate = new Date(newDate);
    appointment.rescheduleReason = reason;
    appointment.rescheduled = true;
    appointment.status = 'rescheduled';
    await appointment.save();

    res.status(200).json({ message: 'Rescheduled.', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const checkInAppointment = async (req, res) => {
  const { studentId } = req.body;
  const adminId = req.user?._id; // ✅ Must come from authentication middleware

  try {
    const appointment = await Appointment.findOne({ studentId });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const today = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);

    if (today.toDateString() !== appointmentDate.toDateString()) {
      return res.status(400).json({
        message: 'You cannot check in before your appointment date.'
      });
    }

    appointment.checkedIn = true;
    appointment.attendedAt = today;
    appointment.status = 'completed';
    appointment.checkedInBy = adminId; // ✅ Save who checked them in

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
      .populate('checkedInBy', 'fullName'); // ✅ Populate admin name

    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
