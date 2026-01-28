"""
S3 Handler - Download and upload files from/to S3
"""

import boto3
from botocore.exceptions import ClientError
from config import settings
import os

class S3Handler:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket_name = settings.S3_BUCKET_NAME
    
    def download_video(self, s3_key: str, local_path: str) -> bool:
        """
        Download video from S3 to local file
        """
        try:
            print(f"Downloading {s3_key} from S3...")
            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                local_path
            )
            print(f"✓ Downloaded to {local_path}")
            return True
            
        except ClientError as e:
            print(f"✗ Failed to download: {e}")
            return False
    
    def upload_results(self, local_path: str, s3_key: str) -> bool:
        """
        Upload detection results to S3
        """
        try:
            print(f"Uploading results to S3: {s3_key}")
            self.s3_client.upload_file(
                local_path,
                self.bucket_name,
                s3_key,
                ExtraArgs={'ContentType': 'application/json'}
            )
            print(f"✓ Results uploaded")
            return True
            
        except ClientError as e:
            print(f"✗ Failed to upload: {e}")
            return False
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False