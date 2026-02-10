# Quick Start Guide

## Step-by-Step Instructions

### 1. Install Dependencies

Open two terminal windows (one for backend, one for frontend):

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Access the Application

Open your browser and go to: `http://localhost:3000`

### 3. Upload Student Data

1. Click the **Upload** tab
2. Select a file with student data (Name, Registration Number, Email columns)
3. Click **Upload**
4. Wait for confirmation message

**Sample CSV format:**
```
Name,Registration Number,Email
John Doe,REG001,john.doe@example.com
Jane Smith,REG002,jane.smith@example.com
Bob Johnson,REG003,bob.johnson@example.com
```

### 4. Generate QR Codes

1. Go to **QR Codes** tab
2. Click on any student to preview their QR code
3. Click **Download** to save individual QR codes
4. Use **⬇️ Download All QR Codes** to get all as HTML file

### 5. Mark Attendance (Scanner)

#### Option A: Manual Entry
1. Go to **Scanner** tab
2. Enter or paste the QR ID
3. Click **Mark Attendance**

#### Option B: Camera Scanner
1. Go to **Scanner** tab
2. Click **📷 Use Camera Scanner**
3. Click **Start Scanning**
4. Point camera at QR code
5. Attendance will be marked automatically

### 6. View Reports

1. Go to **Report** tab
2. Select a date
3. View attendance summary and table
4. Click **⬇️ Download CSV** to export data

## Keyboard Shortcuts in Scanner

- Quick scan by entering QR ID manually (useful for barcode scanners)
- System automatically marks attendance when QR is scanned

## Features

✅ Multiple students at once  
✅ Real-time QR scanning  
✅ Duplicate prevention (won't mark same person twice in one day)  
✅ CSV reports export  
✅ Beautiful responsive UI  
✅ Mobile-friendly scanner  

## Troubleshooting

**Can't connect to backend?**
- Check if backend is running on port 5000
- See console for error messages

**Camera not working?**
- Grant browser permission when prompted
- Use manual entry as backup

**Excel file rejected?**
- Check file format (.xlsx, .xls, or .csv)
- Verify columns: Name, Registration Number, Email

**QR code won't scan?**
- Make sure lighting is good
- Hold QR code steady
- Try manual entry instead

## API Endpoints Reference

- `POST /api/upload` - Upload Excel file
- `GET /api/students` - List all students
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:date` - Get daily records
- `GET /api/report` - Download CSV
- `GET /api/stats` - View statistics

## What Gets Stored?

All data is stored locally in JSON format:
- `backend/data/students.json` - Student records
- `backend/data/attendance.json` - Attendance logs
- `backend/data/qrcodes.json` - QR mappings

No external database needed!

## Production Deployment

Before deploying to production:

1. **Add Authentication** - Protect the scanner and reports
2. **Use a Database** - Replace JSON with PostgreSQL/MongoDB
3. **Enable HTTPS** - Required for camera access
4. **Add Rate Limiting** - Prevent abuse
5. **Validate Inputs** - Sanitize all uploads
6. **Set Environment Variables** - Secure API endpoints

See README.md for more details.
