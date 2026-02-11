import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import '../styles/App.css';

function QRGenerator() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (student) => {
    if (!student.qrCode) return;
    
    const link = document.createElement('a');
    link.href = student.qrCode;
    link.download = `${student.name}_${student.registrationNumber}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllQRCodes = async () => {
    // Create a simple HTML file with all QR codes
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          .qr-container { 
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            display: inline-block;
            margin-right: 20px;
            text-align: center;
          }
          .qr-container img { max-width: 200px; }
          .info { margin-top: 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>QR Codes for Attendance</h1>
    `;

    students.forEach(student => {
      if (student.qrCode) {
        html += `
          <div class="qr-container">
            <img src="${student.qrCode}" />
            <div class="info">
              <strong>${student.name}</strong><br/>
              ${student.registrationNumber}<br/>
              ${student.email}<br/>
              <small class="qr-id">ID: ${student.qrId}</small>
            </div>
          </div>
        `;
      }
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'all_qr_codes.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="card"><p>Loading students...</p></div>;

  if (students.length === 0) {
    return (
      <div className="card">
        <h2>📱 QR Codes</h2>
        <p className="description">No students uploaded yet. Please upload an Excel file first.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📱 Generated QR Codes</h2>
      <p className="description">Total: {students.length} students</p>
      
      <button onClick={downloadAllQRCodes} className="btn btn-success">
        ⬇️ Download All QR Codes (HTML)
      </button>

      <div className="students-grid">
        {students.map(student => (
          <div
            key={student.id}
            className="student-card"
            onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
          >
            <h4>{student.name}</h4>
            <p>{student.registrationNumber}</p>
            <p className="email">{student.email}</p>
            
            {selectedStudent?.id === student.id && student.qrCode && (
              <>
                <img src={student.qrCode} alt="QR Code" className="qr-preview" />
                <div style={{ marginTop: 8 }}>
                  <small className="qr-id">ID: {student.qrId}</small>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadQRCode(student);
                  }}
                  className="btn btn-small"
                >
                  Download
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QRGenerator;
