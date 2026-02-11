import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import xlsx from 'xlsx';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Data file paths
const studentsFile = join(__dirname, 'data', 'students.json');
const attendanceFile = join(__dirname, 'data', 'attendance.json');
const qrCodesFile = join(__dirname, 'data', 'qrcodes.json');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

// Initialize data files
function initializeDataFiles() {
  const dataDir = join(__dirname, 'data');
  
  // Create data directory if it doesn't exist
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    readFileSync(studentsFile);
  } catch {
    writeFileSync(studentsFile, JSON.stringify([], null, 2));
  }
  try {
    readFileSync(attendanceFile);
  } catch {
    writeFileSync(attendanceFile, JSON.stringify([], null, 2));
  }
  try {
    readFileSync(qrCodesFile);
  } catch {
    writeFileSync(qrCodesFile, JSON.stringify({}, null, 2));
  }
}

initializeDataFiles();

// Helper functions
async function readJSON(filePath) {
  try {
    const data = await readFileAsync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return filePath === studentsFile ? [] : filePath === attendanceFile ? [] : {};
  }
}

async function writeJSON(filePath, data) {
  await writeFileAsync(filePath, JSON.stringify(data, null, 2));
}

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

    // Validate data
    const students = data.map((row) => ({
      id: uuidv4(),
      qrId: uuidv4(),
      name: row.Name || row.name || '',
      registrationNumber: row['Registration Number'] || row['registration number'] || row.RegNo || '',
      email: row.Email || row.email || '',
      qrCode: null
    })).filter(s => s.name && s.email);

    // Save students
    await writeJSON(studentsFile, students);

    // Generate QR codes
    const qrCodes = {};
    for (const student of students) {
      try {
        const qrDataUrl = await QRCode.toDataURL(student.qrId);
        qrCodes[student.qrId] = {
          studentId: student.id,
          name: student.name,
          registrationNumber: student.registrationNumber,
          email: student.email,
          qrCode: qrDataUrl
        };
      } catch (error) {
        console.error(`Error generating QR for ${student.email}:`, error);
      }
    }

    await writeJSON(qrCodesFile, qrCodes);

    // Update students with QR code reference
    const updatedStudents = students.map(s => ({
      ...s,
      qrCode: qrCodes[s.qrId]?.qrCode || null
    }));
    await writeJSON(studentsFile, updatedStudents);

    res.json({
      success: true,
      message: `${students.length} students imported successfully`,
      count: students.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Get all students with QR codes
app.get('/api/students', async (req, res) => {
  try {
    const students = await readJSON(studentsFile);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students' });
  }
});

// Get single student by QR ID (for scanning)
app.get('/api/student/:qrId', async (req, res) => {
  try {
    const qrCodes = await readJSON(qrCodesFile);
    const studentData = qrCodes[req.params.qrId];

    if (!studentData) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json(studentData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

// Mark attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { qrId, timestamp } = req.body;

    const qrCodes = await readJSON(qrCodesFile);
    const student = qrCodes[qrId];

    if (!student) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const attendance = await readJSON(attendanceFile);
    
    // Check if already marked for today
    const today = new Date().toISOString().split('T')[0];
    const alreadyMarked = attendance.some(
      a => a.qrId === qrId && a.date === today
    );

    if (alreadyMarked) {
      return res.json({ 
        success: true, 
        message: 'Already marked for today',
        alreadyMarked: true,
        student
      });
    }

    attendance.push({
      qrId,
      studentId: student.studentId,
      name: student.name,
      registrationNumber: student.registrationNumber,
      email: student.email,
      timestamp: timestamp || new Date().toISOString(),
      date: today
    });

    await writeJSON(attendanceFile, attendance);

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
    const attendance = await readJSON(attendanceFile);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Get attendance for specific date
app.get('/api/attendance/:date', async (req, res) => {
  try {
    const attendance = await readJSON(attendanceFile);
    const filtered = attendance.filter(a => a.date === req.params.date);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Get attendance statistics
app.get('/api/stats', async (req, res) => {
  try {
    const students = await readJSON(studentsFile);
    const attendance = await readJSON(attendanceFile);

    const stats = {
      totalStudents: students.length,
      totalAttendanceRecords: attendance.length,
      attendanceByStudent: {}
    };

    students.forEach(student => {
      const count = attendance.filter(a => a.qrId === student.qrId).length;
      stats.attendanceByStudent[student.name] = count;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Download attendance report (CSV)
app.get('/api/report', async (req, res) => {
  try {
    const attendance = await readJSON(attendanceFile);
    
    if (attendance.length === 0) {
      return res.status(400).json({ error: 'No attendance records' });
    }

    // Convert to CSV with UTF-8 BOM for Excel support
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
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const bom = '\ufeff';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(bom + csv);
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
});

// Clear data (for testing)
app.delete('/api/data', async (req, res) => {
  try {
    await writeJSON(studentsFile, []);
    await writeJSON(attendanceFile, []);
    await writeJSON(qrCodesFile, {});
    res.json({ success: true, message: 'Data cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Error clearing data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
