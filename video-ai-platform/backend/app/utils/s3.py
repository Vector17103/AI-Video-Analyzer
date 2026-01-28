import boto3
from botocore.exceptions import ClientError
from app.config import settings
import uuid
 
s3_client = boto3.client(
    's3',
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)
 
def generate_presigned_upload_url(
    filename: str,
    content_type: str,
    user_id: str
) -> dict:
    """
    Generate a pre-signed URL for uploading to S3
    """
    try:
        # Generate unique filename
        file_extension = filename.split('.')[-1]
        unique_filename = f"uploads/{user_id}/{uuid.uuid4()}.{file_extension}"
        # Generate pre-signed URL
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': unique_filename,
                'ContentType': content_type,
            },
            ExpiresIn=settings.UPLOAD_EXPIRATION
        )
        return {
            "upload_url": presigned_url,
            "file_key": unique_filename,
            "expires_in": settings.UPLOAD_EXPIRATION
        }
    except ClientError as e:
        raise Exception(f"Failed to generate pre-signed URL: {str(e)}")
 
def verify_file_exists(file_key: str) -> bool:
    """
    Verify that a file exists in S3
    """
    try:
        s3_client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=file_key)
        return True
    except ClientError:
        return False