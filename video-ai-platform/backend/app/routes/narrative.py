"""
Narrative Generation Routes
Endpoints for generating AI-powered video narratives
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import boto3
from decimal import Decimal
from datetime import datetime
import os

from app.utils.narrative_service import NarrativeService

router = APIRouter()

# Initialize narrative service
narrative_service = NarrativeService()

# Initialize DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv('AWS_REGION', 'us-east-2')
)
table = dynamodb.Table('video-detections')


def decimal_to_float(obj):
    """Convert Decimal to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj


@router.post("/videos/{video_id}/narrative")
async def generate_narrative(video_id: str):
    """
    Generate AI narrative for a video
    
    Args:
        video_id: UUID of the video
    
    Returns:
        Generated narrative with key moments and summary
    """
    
    try:
        # Get video data from DynamoDB
        response = table.get_item(Key={'video_id': video_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
        
        video_data = response['Item']
        
        # Convert Decimals to floats
        video_data = decimal_to_float(video_data)
        
        # Extract metadata
        metadata = video_data.get('metadata', {})
        
        # Extract detections
        detections = video_data.get('detections', [])
        
        if not detections:
            raise HTTPException(
                status_code=400,
                detail="No detections found for this video"
            )
        
        # Extract audio analysis
        audio_analysis = video_data.get('audio_analysis', None)
        
        # Generate narrative using Claude
        print(f"Generating narrative for video {video_id}...")
        print(f"  Detections: {len(detections)}")
        print(f"  Audio: {'Yes' if audio_analysis else 'No'}")
        
        narrative_result = narrative_service.generate_narrative(
            video_metadata=metadata,
            detections=detections,
            audio_analysis=audio_analysis
        )
        
        # Save narrative back to DynamoDB
        try:
            table.update_item(
                Key={'video_id': video_id},
                UpdateExpression='SET narrative = :narrative, narrative_generated_at = :timestamp',
                ExpressionAttributeValues={
                    ':narrative': narrative_result,
                    ':timestamp': int(datetime.now().timestamp())
                }
            )
            print(f"✓ Narrative saved to DynamoDB")
        except Exception as e:
            print(f"⚠️  Could not save narrative to DynamoDB: {e}")
        
        return {
            "video_id": video_id,
            "narrative": narrative_result['narrative'],
            "key_moments": narrative_result.get('key_moments', []),
            "summary": narrative_result.get('summary', ''),
            "confidence": narrative_result.get('confidence', 'medium'),
            "metadata": {
                "detection_count": len(detections),
                "has_audio": bool(audio_analysis),
                "duration": metadata.get('duration', 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating narrative: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{video_id}/narrative")
async def get_narrative(video_id: str):
    """
    Get existing narrative for a video
    
    Args:
        video_id: UUID of the video
    
    Returns:
        Previously generated narrative or 404 if not found
    """
    
    try:
        # Get video data from DynamoDB
        response = table.get_item(Key={'video_id': video_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
        
        video_data = response['Item']
        video_data = decimal_to_float(video_data)
        
        # Check if narrative exists
        if 'narrative' not in video_data:
            raise HTTPException(
                status_code=404,
                detail="No narrative generated yet. Call POST /videos/{video_id}/narrative first"
            )
        
        narrative = video_data['narrative']
        
        return {
            "video_id": video_id,
            "narrative": narrative.get('narrative', ''),
            "key_moments": narrative.get('key_moments', []),
            "summary": narrative.get('summary', ''),
            "confidence": narrative.get('confidence', 'medium'),
            "generated_at": video_data.get('narrative_generated_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching narrative: {e}")
        raise HTTPException(status_code=500, detail=str(e))