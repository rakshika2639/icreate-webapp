# QR Attendance System

A complete web application for managing student attendance using QR codes. Upload student data from Excel, generate unique QR codes, scan them for attendance, and track attendance records.

## Features

- 📤 **Excel Upload**: Import student data (Name, Registration Number, Email)
- 🎫 **QR Code Generation**: Automatically generate unique QR codes for each student
- 📸 **QR Scanner**: Real-time QR code scanning with camera support
- 📊 **Attendance Tracking**: Track attendance records with timestamps
- 📋 **Reports**: View attendance data and download as CSV
- 🎨 **Modern UI**: Beautiful, responsive interface

## Project Structure

```
icreate/
├── backend/
│   ├── server.js          # Express server
│   ├── data/              # JSON data storage
│   ├── package.json
│   └── routes/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/        # CSS styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### 1. Upload Student Data

1. Go to the **Upload** tab
2. Select an Excel file (.xlsx, .xls, .csv) with columns:
   - Name
   - Registration Number
   - Email

Example Excel format:
```
| Name          | Registration Number | Email              |
|---------------|--------------------|--------------------|
| John Doe      | REG001             | john@example.com   |
| Jane Smith    | REG002             | jane@example.com   |
```

### 2. Generate QR Codes

1. After uploading, go to the **QR Codes** tab
2. Click on a student card to preview their QR code
3. Download individual QR codes or all codes as HTML

### 3. Scan for Attendance

Go to the **Scanner** tab and choose:
- **Manual Entry**: Enter QR ID directly (useful for web-based scanners)
- **Camera Scanner**: Use device camera to scan QR codes

The system will:
- Identify the student
- Mark attendance with timestamp
- Prevent duplicate entries for the same day

### 4. View Attendance Report

1. Go to the **Report** tab
2. Select a date to view attendance for that day
3. View statistics and download CSV report

## API Endpoints

### File Upload
- `POST /api/upload` - Upload Excel file with student data

### Students
- `GET /api/students` - Get all students with QR codes
- `GET /api/student/:qrId` - Get single student by QR ID

### Attendance
- `POST /api/attendance` - Mark attendance for a student
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/:date` - Get attendance for specific date
- `GET /api/report` - Download attendance as CSV

### Statistics
- `GET /api/stats` - Get attendance statistics

## Technologies Used

### Backend
- Node.js
- Express.js
- CORS
- Multer (file upload)
- XLSX (Excel parsing)
- QRCode (QR generation)
- UUID (unique IDs)

### Frontend
- React 18
- Vite
- Axios (HTTP client)
- QR-Scanner (QR scanning)
- CSS3 (styling)

## Data Storage

The system uses JSON files for data storage (no database required):
- `data/students.json` - Student information
- `data/attendance.json` - Attendance records
- `data/qrcodes.json` - QR code mappings

## Features in Detail

### Excel Import
- Supports .xlsx, .xls, and .csv files
- Automatic column detection
- Validation of required fields

### QR Code Generation
- Unique QR ID per student
- Encoded with student identification
- Can be downloaded individually or as batch HTML

### Real-time Scanner
- Camera-based scanning
- Manual text input fallback
- Live feedback on successful scan
- Duplicate detection (prevents multiple entries same day)

### Attendance Tracking
- Timestamped records
- Date-based filtering
- Attendance statistics
- CSV export

## Security Considerations

For production use, consider:
- Add authentication/authorization
- Use a proper database (PostgreSQL, MongoDB)
- Validate all file uploads
- Implement rate limiting
- Use HTTPS
- Secure API endpoints

## Troubleshooting

### Camera not working
- Check browser permissions for camera access
- Try using HTTPS (required for camera in production)
- Use manual entry as fallback

### Excel file not uploading
- Ensure file has correct format (.xlsx, .xls, .csv)
- Check that required columns exist: Name, Registration Number, Email

### QR codes not generating
- Ensure students are uploaded first
- Check backend server is running
- Check browser console for errors

## Development Notes

- Backend runs on port 5000
- Frontend runs on port 3000
- API requests are proxied through Vite dev server
- Data persists in JSON files during app runtime

## License

ISC

## Support

For issues or questions, please check the console for error messages and ensure both backend and frontend servers are running.
