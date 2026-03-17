"""
Detection API Models
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Detection(BaseModel):
    frame: int
    timestamp: float
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    track_id: Optional[int] = None
    area: Optional[float] = None
    
    # MODEL ATTRIBUTION FIELDS - Added for model breakdown
    model_source: Optional[str] = None
    model_type: Optional[str] = None
    ensemble_models: Optional[List[str]] = None
    tracking_source: Optional[str] = None
    
    class Config:
        # Allow extra fields from DynamoDB that aren't in schema
        extra = "allow"

class VideoMetadata(BaseModel):
    width: int
    height: int
    fps: float
    total_frames: int
    duration: float
    frames_processed: int
    processing_mode: Optional[str] = None
    ensemble_models: Optional[List[str]] = None
    has_audio: Optional[bool] = None
    
    class Config:
        extra = "allow"

class DetectionSummary(BaseModel):
    total: int
    by_class: Dict[str, int]
    unique_classes: int
    unique_tracked_objects: Optional[int] = None
    dominant_objects: Optional[List[Dict[str, Any]]] = None
    processing_quality: Optional[str] = None
    optimization: Optional[str] = None
    model_contributions: Optional[Dict[str, Any]] = None
    has_audio: Optional[bool] = None
    speech_segments: Optional[int] = None
    audio_confirmations: Optional[int] = None
    
    class Config:
        extra = "allow"

class VideoResponse(BaseModel):
    video_id: str
    user_id: str
    s3_key: str
    status: str
    created_at: str
    updated_at: str
    processed_at: Optional[str] = None
    total_detections: Optional[int] = None
    metadata: Optional[VideoMetadata] = None
    error_message: Optional[str] = None

class VideoDetailResponse(VideoResponse):
    detections: Optional[List[Detection]] = None
    summary: Optional[DetectionSummary] = None
    scenes: Optional[List[Dict[str, Any]]] = None
    motion_analysis: Optional[Dict[str, Any]] = None
    audio_analysis: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"

class VideoListResponse(BaseModel):
    videos: List[VideoResponse]
    count: int