import { useState } from 'react'
import FileUpload from './components/FileUpload'
import QRGenerator from './components/QRGenerator'
import QRScanner from './components/QRScanner'
import AttendanceReport from './components/AttendanceReport'
import './styles/App.css'

function App() {
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎫 QR Attendance System</h1>
          <p>Manage student attendance with QR codes</p>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
        <button
          className={`nav-tab ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          QR Codes
        </button>
        <button
          className={`nav-tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          Scanner
        </button>
        <button
          className={`nav-tab ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Report
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'upload' && <FileUpload />}
        {activeTab === 'qr' && <QRGenerator />}
        {activeTab === 'scan' && <QRScanner />}
        {activeTab === 'report' && <AttendanceReport />}
      </main>

      <footer className="footer">
        <p>QR Attendance System v1.0 • Built for efficient attendance management</p>
      </footer>
    </div>
  )
}

export default App
