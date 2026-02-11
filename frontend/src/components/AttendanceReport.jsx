import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import '../styles/App.css';

function AttendanceReport() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/attendance/${selectedDate}`),
        axios.get(`${API_URL}/api/stats`)
      ]);
      setAttendance(attendanceRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (attendance.length === 0) return;
    
    setDownloading(true);
    try {
      const response = await axios.get(`${API_URL}/api/report`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card">
      <h2>📊 Attendance Report</h2>

      {stats && (
        <div className="stats-summary">
          <div className="stat-box">
            <h4>Total Students</h4>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
          <div className="stat-box">
            <h4>Today's Attendance</h4>
            <p className="stat-number">{attendance.length}</p>
          </div>
          <div className="stat-box">
            <h4>Attendance Rate</h4>
            <p className="stat-number">
              {stats.totalStudents > 0 
                ? ((attendance.length / stats.totalStudents) * 100).toFixed(1) + '%'
                : '0%'}
            </p>
          </div>
        </div>
      )}

      <div className="controls">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field"
        />
        <button 
          onClick={downloadReport} 
          className="btn btn-success"
          disabled={downloading || attendance.length === 0}
        >
          {downloading ? '⌛ Generating...' : '⬇️ Download CSV'}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : attendance.length === 0 ? (
        <p className="description">No attendance records for {selectedDate}</p>
      ) : (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Registration No</th>
                <th>Email</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={index}>
                  <td>{record.name}</td>
                  <td>{record.registrationNumber}</td>
                  <td>{record.email}</td>
                  <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AttendanceReport;
