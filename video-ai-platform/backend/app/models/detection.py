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

class VideoMetadata(BaseModel):
    width: int
    height: int
    fps: float
    total_frames: int
    duration: float
    frames_processed: int

class DetectionSummary(BaseModel):
    total: int
    by_class: Dict[str, int]
    unique_classes: int

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

class VideoListResponse(BaseModel):
    videos: List[VideoResponse]
    count: int