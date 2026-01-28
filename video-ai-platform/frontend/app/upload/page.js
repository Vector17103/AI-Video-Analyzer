'use client';

import VideoUpload from '../components/VideoUpload';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import '../../lib/aws';

export default function UploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch {
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px' }}>
      <VideoUpload />
    </main>
  );
}