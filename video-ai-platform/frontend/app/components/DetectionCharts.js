'use client';

import { useEffect, useRef } from 'react';

export default function DetectionCharts({ video }) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const timelineChartRef = useRef(null);
  
  const barChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const timelineChartInstance = useRef(null);

  useEffect(() => {
    // Load Chart.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.async = true;
    script.onload = () => {
      console.log('✓ Chart.js loaded');
      createCharts();
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: destroy charts when component unmounts
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
      if (timelineChartInstance.current) timelineChartInstance.current.destroy();
    };
  }, [video]);

  function prepareChartData() {
    if (!video.summary || !video.summary.by_class) {
      return null;
    }

    const labels = Object.keys(video.summary.by_class);
    const data = Object.values(video.summary.by_class);
    
    // Generate colors for each object type
    const backgroundColors = labels.map((_, index) => {
      const hue = (index * 137) % 360; // Golden angle for color distribution
      return `hsla(${hue}, 70%, 60%, 0.8)`;
    });
    
    const borderColors = backgroundColors.map(color => 
      color.replace('0.8', '1')
    );

    return { labels, data, backgroundColors, borderColors };
  }

  function prepareTimelineData() {
    if (!video.detections || video.detections.length === 0) {
      return null;
    }

    // Group detections by time intervals (every 5 seconds)
    const interval = 5; // seconds
    const maxTime = video.metadata?.duration || 60;
    const buckets = Math.ceil(maxTime / interval);
    
    const timeLabels = [];
    const timeCounts = new Array(buckets).fill(0);
    
    for (let i = 0; i < buckets; i++) {
      const startTime = i * interval;
      timeLabels.push(`${startTime}s`);
    }
    
    // Count detections in each time bucket
    video.detections.forEach(detection => {
      const bucketIndex = Math.floor(detection.timestamp / interval);
      if (bucketIndex < buckets) {
        timeCounts[bucketIndex]++;
      }
    });

    return { timeLabels, timeCounts };
  }

  function createBarChart(chartData) {
    const ctx = barChartRef.current?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    barChartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels.map(label => 
          label.charAt(0).toUpperCase() + label.slice(1)
        ),
        datasets: [{
          label: 'Number of Detections',
          data: chartData.data,
          backgroundColor: chartData.backgroundColors,
          borderColor: chartData.borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Detections by Object Type',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function createPieChart(chartData) {
    const ctx = pieChartRef.current?.getContext('2d');
    if (!ctx) return;

    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

    pieChartInstance.current = new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels: chartData.labels.map(label => 
          label.charAt(0).toUpperCase() + label.slice(1)
        ),
        datasets: [{
          data: chartData.data,
          backgroundColor: chartData.backgroundColors,
          borderColor: chartData.borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Object Distribution',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function createTimelineChart(timelineData) {
    const ctx = timelineChartRef.current?.getContext('2d');
    if (!ctx) return;

    if (timelineChartInstance.current) {
      timelineChartInstance.current.destroy();
    }

    timelineChartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.timeLabels,
        datasets: [{
          label: 'Detections per Interval',
          data: timelineData.timeCounts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Detection Activity Over Time',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function createCharts() {
    if (!window.Chart) {
      console.error('Chart.js not loaded');
      return;
    }

    const chartData = prepareChartData();
    const timelineData = prepareTimelineData();

    if (chartData) {
      createBarChart(chartData);
      createPieChart(chartData);
    }

    if (timelineData) {
      createTimelineChart(timelineData);
    }
  }

  if (!video.summary && !video.detections) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          No detection data available to display charts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Detection Analytics
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-4" style={{ height: '300px' }}>
          <canvas ref={barChartRef}></canvas>
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-4" style={{ height: '300px' }}>
          <canvas ref={pieChartRef}></canvas>
        </div>
      </div>

      {/* Timeline Chart - Full Width */}
      <div className="bg-gray-50 rounded-lg p-4" style={{ height: '300px' }}>
        <canvas ref={timelineChartRef}></canvas>
      </div>
    </div>
  );
}