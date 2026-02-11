"""
Video routes for retrieving video information and URLs
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
import os
from typing import Optional
from dotenv import load_dotenv  # ADD THIS

# Load environment variables
load_dotenv()  # ADD THIS

router = APIRouter()

# AWS Configuration
S3_BUCKET = os.getenv('S3_BUCKET_NAME', 'video-ai-uploads')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')

# Initialize S3 client
s3_client = boto3.client('s3', region_name=AWS_REGION)


class VideoUrlResponse(BaseModel):
    video_url: str
    expires_in: int


@router.get("/videos/{video_id}/url", response_model=VideoUrlResponse)
async def get_video_url(video_id: str, user_id: str):
    """
    Generate a presigned URL for video playback
    
    Args:
        video_id: The video identifier
        user_id: The user who owns the video
    
    Returns:
        Presigned URL valid for 1 hour
    """
    try:
        # Construct S3 key
        s3_key = f"uploads/{user_id}/{video_id}.mp4"
        
        print(f"Generating presigned URL for: {s3_key}")
        
        # Check if video exists
        try:
            s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise HTTPException(
                    status_code=404,
                    detail=f"Video not found: {video_id}"
                )
            raise
        
        # Generate presigned URL (valid for 1 hour)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': s3_key
            },
            ExpiresIn=3600  # 1 hour
        )
        
        print(f"✓ Generated presigned URL (expires in 3600s)")
        
        return VideoUrlResponse(
            video_url=presigned_url,
            expires_in=3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate video URL: {str(e)}"
        )


@router.get("/videos/{video_id}/check")
async def check_video_exists(video_id: str, user_id: str):
    """
    Check if a video file exists in S3
    
    Args:
        video_id: The video identifier
        user_id: The user who owns the video
    
    Returns:
        exists: boolean indicating if video exists
    """
    try:
        s3_key = f"uploads/{user_id}/{video_id}.mp4"
        
        s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
        
        return {"exists": True, "s3_key": s3_key}
        
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return {"exists": False, "s3_key": s3_key}
        raise HTTPException(
            status_code=500,
            detail=f"Error checking video: {str(e)}"
        )