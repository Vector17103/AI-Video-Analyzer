"""
Video Processor - Run YOLOv8 detection on videos
"""

from ultralytics import YOLO
import cv2
import os
from typing import List, Dict
from config import settings
import json
from decimal import Decimal

class VideoProcessor:
    def __init__(self):
        print("Loading YOLOv8 model...")
        self.model = YOLO('yolov8n.pt')
        print("✓ Model loaded")
    
    def _convert_to_decimal(self, obj):
        """
        Recursively convert all floats to Decimal for DynamoDB compatibility
        """
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: self._convert_to_decimal(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_decimal(item) for item in obj]
        else:
            return obj
    
    def process_video(self, video_path: str, video_id: str) -> Dict:
        """
        Process video and return detection results
        """
        print(f"\nProcessing video: {video_path}")
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Failed to open video: {video_path}")
        
        # Get video info
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"Video info: {width}x{height}, {fps:.2f} FPS, {total_frames} frames")
        
        detections = []
        frame_count = 0
        processed_count = 0
        
        # Process frames
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every Nth frame
            if frame_count % settings.PROCESS_EVERY_N_FRAMES == 0:
                results = self.model(frame, verbose=False)
                
                # Extract detections from this frame
                for r in results:
                    for box in r.boxes:
                        detection = {
                            'frame': frame_count,
                            'timestamp': frame_count / fps if fps > 0 else 0,
                            'class_id': int(box.cls[0]),
                            'class_name': self.model.names[int(box.cls[0])],
                            'confidence': float(box.conf[0]),
                            'bbox': {
                                'x1': float(box.xyxy[0][0]),
                                'y1': float(box.xyxy[0][1]),
                                'x2': float(box.xyxy[0][2]),
                                'y2': float(box.xyxy[0][3])
                            }
                        }
                        detections.append(detection)
                
                processed_count += 1
                
                # Progress update
                if processed_count % 10 == 0:
                    progress = (frame_count / total_frames) * 100
                    print(f"Progress: {frame_count}/{total_frames} ({progress:.1f}%)")
            
            frame_count += 1
        
        cap.release()
        
        # Compile results (with floats for JSON saving)
        results_data = {
            'video_id': video_id,
            'metadata': {
                'width': width,
                'height': height,
                'fps': fps,
                'total_frames': total_frames,
                'duration': duration,
                'frames_processed': processed_count
            },
            'detections': detections,
            'summary': self._create_summary(detections)
        }
        
        print(f"\n✓ Processing complete!")
        print(f"  Total detections: {len(detections)}")
        print(f"  Frames processed: {processed_count}/{total_frames}")
        
        return results_data
    
    def _create_summary(self, detections: List[Dict]) -> Dict:
        """
        Create summary statistics from detections
        """
        if not detections:
            return {'total': 0, 'by_class': {}}
        
        by_class = {}
        for det in detections:
            class_name = det['class_name']
            if class_name not in by_class:
                by_class[class_name] = 0
            by_class[class_name] += 1
        
        return {
            'total': len(detections),
            'by_class': by_class,
            'unique_classes': len(by_class)
        }
    
    def save_results_to_file(self, results: Dict, output_path: str):
        """
        Save results to JSON file (with floats for readability)
        """
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"✓ Results saved to {output_path}")
    
    def prepare_for_dynamodb(self, results: Dict) -> Dict:
        """
        Convert results to DynamoDB-compatible format (floats -> Decimals)
        """
        return self._convert_to_decimal(results)