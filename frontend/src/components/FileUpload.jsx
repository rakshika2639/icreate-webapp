import React, { useState } from 'react';
import axios from 'axios';
import '../styles/App.css';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`✓ ${response.data.count} students imported successfully!`);
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card upload-card">
      <h2>📤 Upload Excel File</h2>
      <p className="description">Upload an Excel file with columns: Name, Registration Number, Email</p>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input"
        />
        <button type="submit" disabled={!file || loading} className="btn btn-primary">
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default FileUpload;
