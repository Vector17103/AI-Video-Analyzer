from fastapi import APIRouter, HTTPException, Depends
from app.models.video import UploadRequest, UploadResponse, UploadConfirmation
from app.utils.s3 import generate_presigned_upload_url, verify_file_exists
from app.utils.cognito import get_current_user
import uuid
from datetime import datetime
 
router = APIRouter(prefix="/upload", tags=["upload"])
 
@router.post("/get-presigned-url", response_model=UploadResponse)
async def get_presigned_url(
    request: UploadRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a pre-signed URL for video upload
    """
    # Validate content type
    if not request.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    try:
        result = generate_presigned_upload_url(
            filename=request.filename,
            content_type=request.content_type,
            user_id=current_user['user_id']
        )
        return UploadResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@router.post("/confirm")
async def confirm_upload(
    confirmation: UploadConfirmation,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm that upload was successful and trigger processing
    """
    # Verify file exists in S3
    if not verify_file_exists(confirmation.file_key):
        raise HTTPException(status_code=404, detail="File not found in S3")
    # Create video record
    video_id = str(uuid.uuid4())
    video_record = {
        "video_id": video_id,
        "user_id": current_user['user_id'],
        "file_key": confirmation.file_key,
        "status": "uploaded",
        "uploaded_at": datetime.utcnow().isoformat()
    }
    # TODO: Save to database
    # TODO: Trigger processing (SQS, Lambda, etc.)
    return {
        "message": "Upload confirmed successfully",
        "video_id": video_id,
        "status": "processing"
    }
 
@router.get("/status/{video_id}")
async def get_video_status(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get processing status of a video
    """
    # TODO: Fetch from database
    return {
        "video_id": video_id,
        "status": "processing",
        "message": "Video is being processed"
    }