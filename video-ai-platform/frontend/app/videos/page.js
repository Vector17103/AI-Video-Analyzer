'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import VideoList from '../components/VideoList';

export default function VideosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await getCurrentUser();
      console.log('User authenticated:', user);
      setAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Not authenticated:', error);
      setAuthenticated(false);
      setLoading(false);
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <VideoList />
    </main>
  );
}
