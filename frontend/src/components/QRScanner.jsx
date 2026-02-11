import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import API_URL from '../config';
import '../styles/App.css';

function QRScanner() {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scannedCount, setScannedCount] = useState(0);
  const [useCamera, setUseCamera] = useState(false);

  const [lastScannedId, setLastScannedId] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false);

  useEffect(() => {
    if (useCamera && videoRef.current && !scanner) {
      startScanning();
    }
    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [useCamera, scanner]);

  const handleManualScan = async (e) => {
    e.preventDefault();
    const qrId = e.target.qrId.value.trim();
    
    if (!qrId) {
      setError('Please enter a QR ID');
      return;
    }

    await markAttendance(qrId);
    e.target.qrId.value = '';
  };

  const markAttendance = async (qrId) => {
    if (scanCooldown && lastScannedId === qrId) return;
    
    try {
      setScanCooldown(true);
      setLastScannedId(qrId);
      setError('');
      setMessage('');
      
      const response = await axios.post(`${API_URL}/api/attendance`, {
        qrId,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        setScannedStudent(response.data.student);
        if (response.data.alreadyMarked) {
          setMessage('⚠️ Already marked for today!');
        } else {
          setMessage('✓ Attendance marked successfully!');
          setScannedCount(prev => prev + 1);
        }
      }
      
      // Reset cooldown after 3 seconds to allow re-scanning if needed
      setTimeout(() => setScanCooldown(false), 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error marking attendance');
      setScannedStudent(null);
      setScanCooldown(false);
    }
  };

  const startScanning = async () => {
    try {
      if (!videoRef.current) return;

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result && result.data) {
            markAttendance(result.data);
          }
        },
        {
          onDecodeError: () => {},
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScanner.start();
      setScanner(qrScanner);
      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Error accessing camera: ' + err.message);
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      await scanner.stop();
      setScanner(null);
      setIsScanning(false);
    }
  };

  return (
    <div className="card scanner-card">
      <h2>📸 QR Scanner</h2>
      <p className="description">Scan student QR codes to mark attendance</p>

      {!useCamera ? (
        <div className="scan-options">
          <div className="option-group">
            <h3>Manual Entry</h3>
            <form onSubmit={handleManualScan} className="manual-scan-form">
              <input
                type="text"
                name="qrId"
                placeholder="Enter QR ID or paste from scanner"
                className="input-field"
              />
              <button type="submit" className="btn btn-primary">
                Mark Attendance
              </button>
            </form>
          </div>

          <div className="divider">OR</div>

          <div className="option-group">
            <button onClick={() => setUseCamera(true)} className="btn btn-secondary">
              📷 Use Camera Scanner
            </button>
          </div>
        </div>
      ) : (
        <div className="camera-section">
          <div className="video-container" style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <video ref={videoRef} className="video-scanner" style={{ width: '100%', borderRadius: '8px' }}></video>
            {!isScanning && (
              <div className="camera-placeholder" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <p>Initializing camera...</p>
              </div>
            )}
          </div>
          
          {isScanning && (
            <button onClick={stopScanning} className="btn btn-danger">
              Stop Camera
            </button>
          )}

          <button
            onClick={() => {
              stopScanning();
              setUseCamera(false);
            }}
            className="btn btn-secondary"
          >
            Back to Manual Entry
          </button>
        </div>
      )}

      {scannedStudent && (
        <div className="scanned-result">
          <h3>✓ Scanned Successfully</h3>
          <p><strong>Name:</strong> {scannedStudent.name}</p>
          <p><strong>Reg No:</strong> {scannedStudent.registrationNumber}</p>
          <p><strong>Email:</strong> {scannedStudent.email}</p>
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {scannedCount > 0 && (
        <div className="scan-count">
          Total Scanned Today: <strong>{scannedCount}</strong>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
