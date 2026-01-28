"""
Detection API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.detection import (
    VideoResponse, 
    VideoDetailResponse, 
    VideoListResponse
)
from app.utils.cognito import get_current_user
from app.utils.db_handler import DBHandler

router = APIRouter(prefix="/videos", tags=["videos"])
db = DBHandler()

@router.get("/", response_model=VideoListResponse)
async def list_user_videos(
    current_user: dict = Depends(get_current_user)
):
    """
    List all videos for the authenticated user
    
    Returns:
        - List of videos with basic info
        - Total count
        - Sorted by created_at (newest first)
    """
    user_id = current_user['user_id']
    
    # Get all videos for this user
    videos = db.get_videos_by_user(user_id)
    
    # Sort by created_at (newest first)
    videos.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {
        "videos": videos,
        "count": len(videos)
    }

@router.get("/{video_id}", response_model=VideoDetailResponse)
async def get_video_details(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific video including detections
    
    Parameters:
        - video_id: The unique identifier for the video
    
    Returns:
        - Complete video information
        - All detections
        - Detection summary
    
    Raises:
        - 404: Video not found
        - 403: Video belongs to different user
    """
    # Get video from database
    video = db.get_video_by_id(video_id)
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Verify user owns this video
    if video.get('user_id') != current_user['user_id']:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to access this video"
        )
    
    return video

@router.get("/{video_id}/status")
async def get_video_status(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get just the processing status of a video (lightweight endpoint)
    
    Useful for polling while video is processing
    
    Returns:
        - video_id
        - status (processing, completed, failed)
        - updated_at
        - error_message (if failed)
    """
    video = db.get_video_by_id(video_id)
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.get('user_id') != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "video_id": video['video_id'],
        "status": video['status'],
        "updated_at": video.get('updated_at'),
        "error_message": video.get('error_message'),
        "total_detections": video.get('total_detections', 0)
    }

@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a video and its detections (optional feature)
    
    Note: This only deletes the database record, not S3 files
    For production, you'd want to delete S3 files too
    """
    video = db.get_video_by_id(video_id)
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.get('user_id') != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from database
    try:
        db.table.delete_item(Key={'video_id': video_id})
        return {"message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete video: {str(e)}"
        )