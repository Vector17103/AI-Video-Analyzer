// app/lib/api.js
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = 'http://localhost:8000/api';

async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

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
    throw new Error('Failed to get upload URL');
  }

  return response.json();
}

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

export async function getVideoStatus(videoId) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/upload/status/${videoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get video status');
  }

  return response.json();
}