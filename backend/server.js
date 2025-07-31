// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db.js';

dotenv.config();

// Initialize Express
const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server and bind to Socket.IO
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
origin: [
  'http://localhost:3000',
  'http://10.39.78.142:5000'
]
,    methods: ['GET', 'POST'],
    credentials: true
  }
});
// Expose io globally so controllers can emit events
global._io = io;

// On connection
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
origin: [
  'http://localhost:3000',
  'http://10.39.78.142:5000'
]
,  credentials: true
}));
app.use(express.json());

// Routes
import userRouter from './routes/userRoute.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/faculty.js';
import libraryRoutes from './routes/library.js';
import labRoutes from './routes/lab.js';
import financeRoutes from './routes/finance.js';
import examinationRoutes from './routes/examination.js';
import appointmentRoutes from './routes/appointment.js';
import groupRoutes from './routes/group.js';
import notificationRoutes from './routes/notification.js';
import clearanceRoutes from './routes/clearance.js';
import courseRoutes from './routes/course.js';
import chatRoutes from './routes/chatRoutes.js';


// Connect to DB
connectDB();

// Register Routes
app.use('/api/users', userRouter);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/examination', examinationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes);



// Static Uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Health Check
app.get('/', (req, res) => {
  res.send('✅ API is working.');
});

// Start Server
server.listen(port, () => {
  console.log(`🚀 Server + Socket.IO running on http://localhost:${port}`);
});
