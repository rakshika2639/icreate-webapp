import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Schemas
const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  qrId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  registrationNumber: { type: String },
  email: { type: String, required: true },
  qrCode: { type: String }
});

const attendanceSchema = new mongoose.Schema({
  qrId: { type: String, required: true },
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  registrationNumber: { type: String },
  email: { type: String, required: true },
  timestamp: { type: String, required: true },
  date: { type: String, required: true }
});

const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes

// Upload Excel file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const studentsToSave = [];

    // Clear existing students for fresh upload
    await Student.deleteMany({});

    // Prepare student data and generate QR codes in parallel
    const qrPromises = data.map(async (row) => {
      const name = row.Name || row.name || '';
      const email = row.Email || row.email || '';
      const regNo = row['Registration Number'] || row['registration number'] || row.RegNo || '';

      if (!name || !email) return null;

      const id = uuidv4();
      const qrId = uuidv4();

      try {
        const qrCode = await QRCode.toDataURL(qrId);
        return {
          id,
          qrId,
          name,
          registrationNumber: regNo,
          email,
          qrCode
        };
      } catch (err) {
        console.error(`QR generation error for ${email}:`, err);
        return null;
      }
    });

    const resolvedStudents = await Promise.all(qrPromises);
    studentsToSave.push(...resolvedStudents.filter(student => student !== null));

    await Student.insertMany(studentsToSave);

    res.json({
      success: true,
      message: `${studentsToSave.length} students imported successfully`,
      count: studentsToSave.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students' });
  }
});

// Get single student by QR ID
app.get('/api/student/:qrId', async (req, res) => {
  try {
    const student = await Student.findOne({ qrId: req.params.qrId });
    if (!student) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

// Mark attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { qrId, timestamp } = req.body;

    const student = await Student.findOne({ qrId });
    if (!student) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const alreadyMarked = await Attendance.findOne({ qrId, date: today });

    if (alreadyMarked) {
      return res.json({ 
        success: true, 
        message: 'Already marked for today',
        alreadyMarked: true,
        student
      });
    }

    const newAttendance = new Attendance({
      qrId,
      studentId: student.id,
      name: student.name,
      registrationNumber: student.registrationNumber,
      email: student.email,
      timestamp: timestamp || new Date().toISOString(),
      date: today
    });

    await newAttendance.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      student
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Error marking attendance' });
  }
});

// Get attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find({}).sort({ timestamp: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Get attendance for specific date
app.get('/api/attendance/:date', async (req, res) => {
  try {
    const attendance = await Attendance.find({ date: req.params.date });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalAttendanceRecords = await Attendance.countDocuments();
    
    // Simple stats: count of students with at least one record
    const uniqueStudentsScanned = await Attendance.distinct('qrId');
    
    res.json({
      totalStudents,
      totalAttendanceRecords,
      uniqueScannedCount: uniqueStudentsScanned.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Download report
app.get('/api/report', async (req, res) => {
  try {
    const attendance = await Attendance.find({}).sort({ date: -1, timestamp: -1 });
    
    if (attendance.length === 0) {
      return res.status(400).json({ error: 'No attendance records' });
    }

    const headers = ['Student ID', 'Name', 'Registration Number', 'Email', 'Date', 'Time'];
    const rows = attendance.map(a => [
      a.studentId,
      a.name,
      a.registrationNumber,
      a.email,
      a.date,
      new Date(a.timestamp).toLocaleTimeString()
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const bom = '\ufeff';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(bom + csv);
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
