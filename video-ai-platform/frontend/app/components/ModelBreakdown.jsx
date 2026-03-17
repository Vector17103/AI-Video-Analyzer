/**
 * Complete ModelBreakdown Component - FIXED VERSION
 * Tracks all 12 AI models in the detection stack
 */

'use client';

export default function ModelBreakdown({ detections, video }) {
  // Debug: Log to see what we're getting
  console.log('ModelBreakdown received:', { 
    detectionsCount: detections?.length, 
    firstDetection: detections?.[0],
    hasModelSource: detections?.[0]?.model_source 
  });

  if (!detections || detections.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p className="text-yellow-800">⚠️ No detections available to analyze</p>
      </div>
    );
  }

  // ALL 12 MODEL CONFIGURATIONS
  const MODEL_CONFIG = {
    // VISUAL MODELS
    'ensemble': {
      name: 'Ensemble (YOLOv11x+10x+9c)',
      category: 'Visual Detection',
      icon: '🎯',
      color: 'blue',
      description: 'Multi-model consensus detection',
      priority: 1
    },
    'yolov11x': {
      name: 'YOLOv11x',
      category: 'Visual Detection',
      icon: '🎯',
      color: 'blue',
      description: 'Primary object detection (93.5% accuracy)',
      priority: 1
    },
    'yolov11x-pose': {
      name: 'YOLOv11x-Pose',
      category: 'Visual Detection',
      icon: '🤸',
      color: 'cyan',
      description: 'Human pose & activity (17 keypoints)',
      priority: 2
    },
    'yolov11x-seg': {
      name: 'YOLOv11x-Seg',
      category: 'Visual Detection',
      icon: '✂️',
      color: 'teal',
      description: 'Pixel-perfect segmentation',
      priority: 3
    },
    'yolov10x': {
      name: 'YOLOv10x',
      category: 'Ensemble',
      icon: '🔵',
      color: 'green',
      description: 'Ensemble validation (secondary)',
      priority: 4
    },
    'yolov9c': {
      name: 'YOLOv9c',
      category: 'Ensemble',
      icon: '🟣',
      color: 'purple',
      description: 'Ensemble validation (tertiary)',
      priority: 5
    },
    'sam2': {
      name: 'SAM2',
      category: 'Segmentation',
      icon: '🎨',
      color: 'pink',
      description: 'Meta ultra-precise segmentation',
      priority: 6
    },
    'clip': {
      name: 'CLIP',
      category: 'Scene Understanding',
      icon: '🖼️',
      color: 'yellow',
      description: 'OpenAI scene comprehension',
      priority: 7
    },
    
    // MOTION/TRACKING
    'optical_flow': {
      name: 'Optical Flow',
      category: 'Motion Tracking',
      icon: '🌊',
      color: 'sky',
      description: 'Motion vectors & speed',
      priority: 8
    },
    'bytetrack': {
      name: 'ByteTrack',
      category: 'Motion Tracking',
      icon: '🎯',
      color: 'violet',
      description: 'Object ID tracking',
      priority: 9
    },
    
    // AUDIO MODELS
    'whisper': {
      name: 'Whisper',
      category: 'Audio Analysis',
      icon: '🎤',
      color: 'indigo',
      description: 'Speech transcription (99 languages)',
      priority: 10
    },
    'wav2vec2': {
      name: 'Wav2Vec2',
      category: 'Audio Analysis',
      icon: '🔊',
      color: 'fuchsia',
      description: 'Sound classification',
      priority: 11
    },
    'audio_events': {
      name: 'Audio Events',
      category: 'Audio Analysis',
      icon: '⚡',
      color: 'rose',
      description: 'Event detection (gunshots, alarms)',
      priority: 12
    },
    'audio_visual_fusion': {
      name: 'Audio-Visual Fusion',
      category: 'Multimodal',
      icon: '🔗',
      color: 'amber',
      description: 'Combined timeline events',
      priority: 13
    },
  };

  // Calculate statistics for each model
  const getModelStats = () => {
    const stats = {};
    
    // Initialize all models
    Object.keys(MODEL_CONFIG).forEach(model => {
      stats[model] = {
        count: 0,
        objects: {},
        confidence_sum: 0,
        avg_confidence: 0
      };
    });

    // Count detections per model
    detections.forEach((det, index) => {
      // Get model_source - handle both direct property and nested
      const model = String(det.model_source || det.model?.source || 'unknown').toLowerCase().trim();
      const className = String(det.class_name || det.class?.name || 'unknown');
      const confidence = parseFloat(det.confidence) || 0;

      if (index < 3) {
        console.log('Processing detection:', { 
          model, 
          className, 
          confidence,
          raw_model_source: det.model_source,
          detection_keys: Object.keys(det)
        });
      }

      if (stats[model]) {
        stats[model].count++;
        stats[model].confidence_sum += confidence;
        
        if (!stats[model].objects[className]) {
          stats[model].objects[className] = 0;
        }
        stats[model].objects[className]++;
      } else {
        // Track unknown models
        if (!stats['unknown']) {
          stats['unknown'] = {
            count: 0,
            objects: {},
            confidence_sum: 0,
            avg_confidence: 0
          };
        }
        stats['unknown'].count++;
        if (index < 3) {
          console.warn('Unknown model source:', model, 'Available models:', Object.keys(MODEL_CONFIG));
        }
      }
    });

    // Calculate average confidence
    Object.keys(stats).forEach(model => {
      if (stats[model].count > 0) {
        stats[model].avg_confidence = stats[model].confidence_sum / stats[model].count;
      }
    });

    console.log('Final stats:', stats);
    return stats;
  };

  const stats = getModelStats();
  const totalDetections = detections.length;
  const activeModels = Object.keys(stats).filter(k => stats[k].count > 0 && k !== 'unknown').length;

  // Group models by category
  const categories = {
    'Visual Detection': [],
    'Ensemble': [],
    'Segmentation': [],
    'Scene Understanding': [],
    'Motion Tracking': [],
    'Audio Analysis': [],
    'Multimodal': []
  };

  Object.entries(MODEL_CONFIG).forEach(([key, config]) => {
    if (stats[key] && stats[key].count > 0) {
      categories[config.category].push({
        key,
        config,
        stats: stats[key]
      });
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(cat => {
    if (categories[cat].length === 0) {
      delete categories[cat];
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        🔬 Complete Detection Stack Analysis
      </h2>
      <p className="text-gray-600 mb-6">
        Detailed breakdown of all {Object.keys(MODEL_CONFIG).length} AI models in the detection pipeline
      </p>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalDetections}</p>
            <p className="text-xs text-gray-600">Total Detections</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{activeModels}</p>
            <p className="text-xs text-gray-600">Active Models</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {Object.keys(categories).length}
            </p>
            <p className="text-xs text-gray-600">Categories Used</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {video?.metadata?.duration?.toFixed(1) || 'N/A'}s
            </p>
            <p className="text-xs text-gray-600">Video Duration</p>
          </div>
        </div>
      </div>

      {/* Show warning if no active models detected */}
      {activeModels === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ No Model Attribution Found</h4>
          <p className="text-sm text-red-700 mb-2">
            This video was processed before model attribution was implemented.
          </p>
          <p className="text-xs text-red-600">
            Upload a new video to see the complete model breakdown.
          </p>
          {stats['unknown'] && stats['unknown'].count > 0 && (
            <p className="text-xs text-red-600 mt-2">
              ({stats['unknown'].count} detections have unknown model source)
            </p>
          )}
        </div>
      )}

      {/* Models by Category */}
      {Object.entries(categories).map(([category, models]) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center border-b pb-2">
            <span className="mr-2">
              {category === 'Visual Detection' && '👁️'}
              {category === 'Ensemble' && '🎯'}
              {category === 'Segmentation' && '✂️'}
              {category === 'Scene Understanding' && '🖼️'}
              {category === 'Motion Tracking' && '🌊'}
              {category === 'Audio Analysis' && '🎤'}
              {category === 'Multimodal' && '🔗'}
            </span>
            {category}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map(({ key, config, stats: modelStats }) => {
              const percentage = ((modelStats.count / totalDetections) * 100).toFixed(1);
              const topObjects = Object.entries(modelStats.objects)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

              return (
                <div 
                  key={key}
                  className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      {percentage}%
                    </span>
                  </div>

                  {/* Model Name */}
                  <h4 className="font-bold text-gray-800 mb-1">
                    {config.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {config.description}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Detections:</span>
                      <span className="font-semibold text-gray-800">
                        {modelStats.count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Confidence:</span>
                      <span className="font-semibold text-gray-800">
                        {(modelStats.avg_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Top Objects */}
                  {topObjects.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Top detections:</p>
                      <div className="flex flex-wrap gap-1">
                        {topObjects.map(([obj, count]) => (
                          <span 
                            key={obj}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {obj} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Models NOT Contributing */}
      {activeModels > 0 && Object.keys(MODEL_CONFIG).filter(k => stats[k].count === 0).length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Models Not Contributing
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(MODEL_CONFIG)
              .filter(k => stats[k].count === 0)
              .map(key => (
                <span 
                  key={key}
                  className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded"
                >
                  {MODEL_CONFIG[key].icon} {MODEL_CONFIG[key].name}
                </span>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These models are installed but didn't contribute detections to this video
          </p>
        </div>
      )}
    </div>
  );
}