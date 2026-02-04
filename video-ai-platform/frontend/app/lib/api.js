/**
 * Complete API client for all backend endpoints
 * Includes upload functions and video/detection functions
 */
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get authentication token from Amplify session
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

// ============================================
// UPLOAD FUNCTIONS (for VideoUpload component)
// ============================================

/**
 * Get pre-signed URL for video upload
 */
export async function getPresignedUploadUrl(filename, contentType) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/upload/get-presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename,
      content_type: contentType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get upload URL: ${errorText}`);
  }

  return response.json();
}

/**
 * Confirm video upload completion
 */
export async function confirmUpload(fileKey) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/upload/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ file_key: fileKey }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm upload');
  }

  return response.json();
}

// ============================================
// VIDEO FUNCTIONS (for video list/details)
// ============================================

/**
 * List all videos for the current user
 */
export async function listVideos() {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/videos/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.status}`);
  }

  return response.json();
}

/**
 * Get detailed information about a specific video
 */
export async function getVideoDetails(videoId) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Video not found');
    }
    throw new Error(`Failed to fetch video: ${response.status}`);
  }

  return response.json();
}

/**
 * Get video processing status (lightweight)
 */
export async function getVideoStatus(videoId) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete video: ${response.status}`);
  }

  return response.json();
}