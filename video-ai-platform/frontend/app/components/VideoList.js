'use client';

import { useState, useEffect } from 'react';
import { listVideos } from '../lib/api';
import Link from 'next/link';

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      setLoading(true);
      setError(null);
      const data = await listVideos();
      console.log('Loaded videos:', data); // Debug log
      setVideos(data.videos);
    } catch (err) {
      setError(err.message);
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredVideos = videos.filter(video => {
    if (filter === 'all') return true;
    return video.status === filter;
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  function getStatusColor(status) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading videos: {error}</p>
          <button
            onClick={loadVideos}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Videos</h1>
        <p className="text-gray-600">View and manage your uploaded videos</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {['all', 'completed', 'processing', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === status
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status} ({videos.filter(v => status === 'all' || v.status === status).length})
            </button>
          ))}
        </nav>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Get started by uploading a video.'
              : `No ${filter} videos found.`}
          </p>
          <div className="mt-6">
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Video
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Link
              key={video.video_id}
              href={`/videos/${video.video_id}`}
              className="group relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              style={{ display: 'block' }} // Force display
            >
              {/* Video Thumbnail Placeholder */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Video Info - WITH INLINE STYLES TO FORCE VISIBILITY */}
              <div className="p-4" style={{ backgroundColor: 'white', position: 'relative', zIndex: 10 }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 
                    className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate flex-1"
                    style={{ color: '#111', fontSize: '14px', fontWeight: '500' }} // Force visibility
                  >
                    {video.video_id}
                  </h3>
                  <span 
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.status)}`}
                    style={{ fontSize: '12px' }} // Force visibility
                  >
                    {video.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500">
                  {video.metadata && (
                    <>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        Resolution: {video.metadata.width}x{video.metadata.height}
                      </p>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        Duration: {video.metadata.duration?.toFixed(1)}s
                      </p>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        FPS: {video.metadata.fps?.toFixed(1)}
                      </p>
                    </>
                  )}
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    Uploaded: {formatDate(video.created_at)}
                  </p>
                </div>

                {video.status === 'completed' && video.total_detections !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900" style={{ color: '#111', fontSize: '14px', fontWeight: '600' }}>
                      {video.total_detections} detection{video.total_detections !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {video.status === 'failed' && video.error_message && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-red-600" style={{ color: '#dc2626', fontSize: '12px' }}>
                      Error: {video.error_message}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={loadVideos}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}