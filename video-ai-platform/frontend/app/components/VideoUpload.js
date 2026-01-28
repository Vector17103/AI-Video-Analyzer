'use client';

import { useState } from 'react';
import { getPresignedUploadUrl, confirmUpload } from '../lib/api';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [videoId, setVideoId] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      setMessage('Please select a video file');
      return;
    }
    
    // Validate file size (max 500 MB)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setMessage('File size must be less than 500 MB');
      return;
    }
    
    setFile(selectedFile);
    setMessage('');
  };

  const uploadToS3 = async (url, file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage('');

    try {
      // Step 1: Get pre-signed URL
      setMessage('Getting upload URL...');
      const { upload_url, file_key } = await getPresignedUploadUrl(
        file.name,
        file.type
      );

      // Step 2: Upload to S3
      setMessage('Uploading video...');
      await uploadToS3(upload_url, file);

      // Step 3: Confirm upload
      setMessage('Confirming upload...');
      const result = await confirmUpload(file_key);
      
      setVideoId(result.video_id);
      setMessage('Upload successful! Video is being processed.');
      setProgress(100);

    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Upload Video for Detection</h2>
      
      <div style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
          id="video-upload"
        />
        <label 
          htmlFor="video-upload"
          style={{
            cursor: uploading ? 'not-allowed' : 'pointer',
            color: '#0070f3',
            fontSize: '16px'
          }}
        >
          {file ? '📹 Change Video' : '📤 Select Video File'}
        </label>
      </div>

      {file && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>Selected:</strong> {file.name}<br/>
          <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB<br/>
          <strong>Type:</strong> {file.type}
        </div>
      )}

      {uploading && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#0070f3',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px' }}>
            {progress}% uploaded
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: '14px 28px',
          backgroundColor: !file || uploading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: !file || uploading ? 'not-allowed' : 'pointer',
          width: '100%',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: message.includes('successful') ? '#d4edda' : 
                          message.includes('failed') ? '#f8d7da' : '#d1ecf1',
          color: message.includes('successful') ? '#155724' : 
                 message.includes('failed') ? '#721c24' : '#0c5460',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {videoId && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>Video ID:</strong> {videoId}
        </div>
      )}
    </div>
  );
}