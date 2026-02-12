import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import xlsx from 'xlsx';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite database
const dbPath = path.join(__dirname, 'data', 'attendance.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      qrId TEXT UNIQUE,
      name TEXT,
      registrationNumber TEXT,
      email TEXT,
      qrCode TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qrId TEXT,
      studentId TEXT,
      name TEXT,
      registrationNumber TEXT,
      email TEXT,
      timestamp TEXT,
      date TEXT,
      FOREIGN KEY (qrId) REFERENCES students (qrId)
    )
  `);

  // Migrate existing JSON data to database
  if (fs.existsSync(path.join(process.cwd(), 'backend', 'data', 'students.json'))) {
    const students = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend', 'data', 'students.json'), 'utf8'));
    if (students.length > 0) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO students (id, qrId, name, registrationNumber, email, qrCode)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      students.forEach(student => {
        stmt.run(
          student.id,
          student.qrId,
          student.name,
          student.registrationNumber,
          student.email,
          student.qrCode
        );
      });
      stmt.finalize();
      console.log('Migrated students data to database');
    }
  }

  if (fs.existsSync(path.join(process.cwd(), 'backend', 'data', 'attendance.json'))) {
    const attendance = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend', 'data', 'attendance.json'), 'utf8'));
    if (attendance.length > 0) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO attendance (qrId, studentId, name, registrationNumber, email, timestamp, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      attendance.forEach(record => {
        stmt.run(
          record.qrId,
          record.studentId,
          record.name,
          record.registrationNumber,
          record.email,
          record.timestamp,
          record.date
        );
      });
      stmt.finalize();
      console.log('Migrated attendance data to database');
    }
  }
});

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

    // Clear existing students for fresh upload
    db.run('DELETE FROM students');
    db.run('DELETE FROM attendance');

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
    const studentsToSave = resolvedStudents.filter(student => student !== null);

    // Insert students into database
    const stmt = db.prepare(`
      INSERT INTO students (id, qrId, name, registrationNumber, email, qrCode)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    studentsToSave.forEach(student => {
      stmt.run(
        student.id,
        student.qrId,
        student.name,
        student.registrationNumber,
        student.email,
        student.qrCode
      );
    });
    stmt.finalize();

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
app.get('/api/students', (req, res) => {
  try {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).json({ error: 'Error fetching students' });
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students' });
  }
});

// Get single student by QR ID
app.get('/api/student/:qrId', (req, res) => {
  try {
    db.get('SELECT * FROM students WHERE qrId = ?', [req.params.qrId], (err, row) => {
      if (err) {
        console.error('Error fetching student:', err);
        return res.status(500).json({ error: 'Error fetching student' });
      }
      if (!row) {
        return res.status(404).json({ error: 'QR code not found' });
      }
      res.json(row);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

// Mark attendance
app.post('/api/attendance', (req, res) => {
  try {
    const { qrId, timestamp } = req.body;

    db.get('SELECT * FROM students WHERE qrId = ?', [qrId], (err, student) => {
      if (err) {
        console.error('Error finding student:', err);
        return res.status(500).json({ error: 'Error marking attendance' });
      }

      if (!student) {
        return res.status(404).json({ error: 'QR code not found' });
      }

      const today = new Date().toISOString().split('T')[0];

      db.get('SELECT * FROM attendance WHERE qrId = ? AND date = ?', [qrId, today], (err, existing) => {
        if (err) {
          console.error('Error checking existing attendance:', err);
          return res.status(500).json({ error: 'Error marking attendance' });
        }

        if (existing) {
          return res.json({
            success: true,
            message: 'Already marked for today',
            alreadyMarked: true,
            student
          });
        }

        const newAttendance = {
          qrId,
          studentId: student.id,
          name: student.name,
          registrationNumber: student.registrationNumber,
          email: student.email,
          timestamp: timestamp || new Date().toISOString(),
          date: today
        };

        db.run(`
          INSERT INTO attendance (qrId, studentId, name, registrationNumber, email, timestamp, date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          newAttendance.qrId,
          newAttendance.studentId,
          newAttendance.name,
          newAttendance.registrationNumber,
          newAttendance.email,
          newAttendance.timestamp,
          newAttendance.date
        ], function(err) {
          if (err) {
            console.error('Error inserting attendance:', err);
            return res.status(500).json({ error: 'Error marking attendance' });
          }

          res.json({
            success: true,
            message: 'Attendance marked successfully',
            student
          });
        });
      });
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Error marking attendance' });
  }
});

// Get attendance records
app.get('/api/attendance', (req, res) => {
  try {
    db.all('SELECT * FROM attendance ORDER BY timestamp DESC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching attendance:', err);
        return res.status(500).json({ error: 'Error fetching attendance' });
      }
      res.json(rows);
    });
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
app.get('/api/stats', (req, res) => {
  try {
    db.get('SELECT COUNT(*) as totalStudents FROM students', [], (err, studentRow) => {
      if (err) {
        console.error('Error fetching student count:', err);
        return res.status(500).json({ error: 'Error fetching stats' });
      }

      db.get('SELECT COUNT(*) as totalAttendanceRecords FROM attendance', [], (err, attendanceRow) => {
        if (err) {
          console.error('Error fetching attendance count:', err);
          return res.status(500).json({ error: 'Error fetching stats' });
        }

        db.all('SELECT DISTINCT qrId FROM attendance', [], (err, uniqueRows) => {
          if (err) {
            console.error('Error fetching unique students:', err);
            return res.status(500).json({ error: 'Error fetching stats' });
          }

          res.json({
            totalStudents: studentRow.totalStudents,
            totalAttendanceRecords: attendanceRow.totalAttendanceRecords,
            uniqueScannedCount: uniqueRows.length
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Download report
app.get('/api/report', (req, res) => {
  try {
    db.all('SELECT * FROM attendance ORDER BY date DESC, timestamp DESC', [], (err, attendance) => {
      if (err) {
        console.error('Error fetching attendance for report:', err);
        return res.status(500).json({ error: 'Error generating report' });
      }

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
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
