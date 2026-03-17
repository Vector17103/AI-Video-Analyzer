/**
 * VideoNarrative Component
 * Displays AI-generated narrative for videos with generate/refresh functionality
 */

'use client';

import { useState, useEffect } from 'react';

export default function VideoNarrative({ videoId }) {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if narrative already exists
  useEffect(() => {
    fetchExistingNarrative();
  }, [videoId]);

  const fetchExistingNarrative = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/videos/${videoId}/narrative`);
      
      if (response.ok) {
        const data = await response.json();
        setNarrative(data);
      } else if (response.status === 404) {
        // No narrative yet, that's fine
        setNarrative(null);
      }
    } catch (err) {
      console.log('No existing narrative');
    }
  };

  const generateNarrative = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/videos/${videoId}/narrative`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate narrative');
      }

      const data = await response.json();
      setNarrative(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">AI Video Narrative</h2>
        
        {!narrative && !loading && (
          <button
            onClick={generateNarrative}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Generate Narrative
          </button>
        )}

        {narrative && !loading && (
          <button
            onClick={generateNarrative}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition"
          >
            🔄 Regenerate
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Generating narrative with AI...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            ❌ Error: {error}
          </p>
        </div>
      )}

      {/* Narrative Content */}
      {narrative && !loading && (
        <div className="space-y-6">
          {/* Main Narrative */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="text-2xl mr-2">📖</span>
              Narrative
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">
              {narrative.narrative}
            </p>
          </div>

          {/* Summary */}
          {narrative.summary && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Summary
              </h4>
              <p className="text-gray-700">
                {narrative.summary}
              </p>
            </div>
          )}

          {/* Key Moments */}
          {narrative.key_moments && narrative.key_moments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 uppercase px-4 pt-4 mb-3">
                Key Moments
              </h4>
              <div className="space-y-2 px-4 pb-4">
                {narrative.key_moments.slice(0, 8).map((moment, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 py-2 border-l-2 border-blue-500 pl-3 hover:bg-gray-50 transition"
                  >
                    <span className="text-blue-600 font-mono text-sm font-semibold min-w-[50px]">
                      {moment.timestamp}s
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        {moment.description}
                      </p>
                      {moment.main_objects && moment.main_objects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {moment.main_objects.map((obj, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                            >
                              {obj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {moment.object_count} detections
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="text-lg mr-1">🎯</span>
                Confidence: <strong className="ml-1 text-gray-700">{narrative.confidence || 'medium'}</strong>
              </span>
              {narrative.metadata && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>
                    {narrative.metadata.detection_count} detections analyzed
                  </span>
                  {narrative.metadata.has_audio && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center">
                        <span className="text-lg mr-1">🎤</span>
                        Audio included
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            {narrative.generated_at && (
              <span className="text-xs text-gray-400">
                Generated: {new Date(narrative.generated_at * 1000).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!narrative && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Narrative Generated Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Click "Generate Narrative" to create an AI-powered description of this video
          </p>
        </div>
      )}
    </div>
  );
}