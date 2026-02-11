'use client';

import { useEffect, useRef, useState } from 'react';
import { getVideoUrl } from '../lib/api';

export default function VideoPlayer({ video }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentDetections, setCurrentDetections] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Load video URL when component mounts
  useEffect(() => {
    loadVideoUrl();
  }, [video.video_id]);

  async function loadVideoUrl() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching video URL for:', video.video_id);
      const url = await getVideoUrl(video.video_id);
      console.log('✓ Got video URL');
      
      setVideoUrl(url);
    } catch (err) {
      console.error('Error loading video URL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Initialize video and canvas when URL loads
  useEffect(() => {
    if (!videoUrl || !videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to match video
    videoElement.addEventListener('loadedmetadata', () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      console.log('✓ Video loaded:', canvas.width, 'x', canvas.height);
    });

    // Update current frame and detections as video plays
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoUrl, video.detections]);

  // Set playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  function handleTimeUpdate() {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    const fps = video.metadata?.fps || 25;
    const currentFrameNum = Math.floor(videoElement.currentTime * fps);
    
    setCurrentFrame(currentFrameNum);
    
    // Find detections for current frame
    const detections = video.detections?.filter(
      d => d.frame === currentFrameNum
    ) || [];
    
    setCurrentDetections(detections);
    
    // Draw bounding boxes
    drawBoundingBoxes(detections);
  }

  function drawBoundingBoxes(detections) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each detection
    detections.forEach(detection => {
      const bbox = detection.bbox;
      const width = bbox.x2 - bbox.x1;
      const height = bbox.y2 - bbox.y1;
      
      // Generate color based on class name
      const color = getColorForClass(detection.class_name);
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x1, bbox.y1, width, height);
      
      // Draw label background
      const label = `${detection.class_name} ${(detection.confidence * 100).toFixed(1)}%`;
      ctx.font = 'bold 16px Arial';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 20;
      
      ctx.fillStyle = color;
      ctx.fillRect(bbox.x1, bbox.y1 - textHeight - 4, textWidth + 10, textHeight + 4);
      
      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, bbox.x1 + 5, bbox.y1 - 8);
    });
  }

  function getColorForClass(className) {
    // Generate consistent color for each class
    const colors = {
      'person': '#FF6B6B',
      'car': '#4ECDC4',
      'truck': '#45B7D1',
      'bus': '#FFA07A',
      'motorcycle': '#98D8C8',
      'bicycle': '#F7DC6F',
      'dog': '#BB8FCE',
      'cat': '#85C1E2',
    };
    
    // Return predefined color or generate one
    if (colors[className]) {
      return colors[className];
    }
    
    // Generate color from class name
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  function togglePlay() {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function seekFrame(direction) {
    if (!videoRef.current) return;

    const fps = video.metadata?.fps || 25;
    const frameDuration = 1 / fps;
    
    videoRef.current.currentTime += direction * frameDuration;
  }

  function handleSeek(e) {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Video</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadVideoUrl}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Playback with Detections</h2>
      
      <div className="space-y-4">
        {/* Video Container */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Previous Frame */}
              <button
                onClick={() => seekFrame(-1)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Previous Frame"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                {isPlaying ? (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Play
                  </span>
                )}
              </button>

              {/* Next Frame */}
              <button
                onClick={() => seekFrame(1)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Next Frame"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="absolute h-full bg-blue-600 rounded-full"
              style={{
                width: videoRef.current
                  ? `${(videoRef.current.currentTime / videoRef.current.duration) * 100}%`
                  : '0%'
              }}
            />
          </div>

          {/* Frame Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Frame: {currentFrame} / {video.metadata?.total_frames || 0}
            </div>
            <div>
              Time: {videoRef.current?.currentTime?.toFixed(2) || 0}s / {video.metadata?.duration?.toFixed(2) || 0}s
            </div>
          </div>
        </div>

        {/* Current Detections */}
        {currentDetections.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Current Frame Detections ({currentDetections.length})
            </h3>
            <div className="space-y-1">
              {currentDetections.map((detection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getColorForClass(detection.class_name) }}
                    />
                    <span className="font-medium capitalize">{detection.class_name}</span>
                  </div>
                  <span className="text-gray-600">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentDetections.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
            No detections in current frame
          </div>
        )}
      </div>
    </div>
  );
}