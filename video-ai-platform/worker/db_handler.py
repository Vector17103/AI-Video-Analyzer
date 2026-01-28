"""
DynamoDB Handler - Store and retrieve video metadata
"""

import boto3
from botocore.exceptions import ClientError
from config import settings
from datetime import datetime
from typing import Optional, Dict, Any

class DBHandler:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.table = self.dynamodb.Table(settings.DYNAMODB_TABLE_NAME)
    
    def create_video_record(self, video_id: str, user_id: str, s3_key: str) -> bool:
        """
        Create initial video record in database
        """
        try:
            self.table.put_item(
                Item={
                    'video_id': video_id,
                    'user_id': user_id,
                    's3_key': s3_key,
                    'status': 'processing',
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                },
                ConditionExpression='attribute_not_exists(video_id)'  # Idempotency
            )
            print(f"✓ Created database record for {video_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                print(f"Record already exists for {video_id} (idempotency check)")
                return True  # Already processed
            print(f"✗ Failed to create record: {e}")
            return False
    
    def update_status(self, video_id: str, status: str, error: str = None) -> bool:
        """
        Update processing status
        """
        try:
            update_expr = "SET #status = :status, updated_at = :updated_at"
            expr_values = {
                ':status': status,
                ':updated_at': datetime.utcnow().isoformat()
            }
            
            if error:
                update_expr += ", error_message = :error"
                expr_values[':error'] = error
            
            self.table.update_item(
                Key={'video_id': video_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues=expr_values
            )
            print(f"✓ Updated status to '{status}' for {video_id}")
            return True
            
        except ClientError as e:
            print(f"✗ Failed to update status: {e}")
            return False
    
    def save_detections(self, video_id: str, detections: list, metadata: dict) -> bool:
        """
        Save detection results to database
        """
        try:
            self.table.update_item(
                Key={'video_id': video_id},
                UpdateExpression="""
                    SET detections = :detections,
                        total_detections = :total,
                        metadata = :metadata,
                        #status = :status,
                        updated_at = :updated_at,
                        processed_at = :processed_at
                """,
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':detections': detections,
                    ':total': len(detections),
                    ':metadata': metadata,
                    ':status': 'completed',
                    ':updated_at': datetime.utcnow().isoformat(),
                    ':processed_at': datetime.utcnow().isoformat()
                }
            )
            print(f"✓ Saved {len(detections)} detections for {video_id}")
            return True
            
        except ClientError as e:
            print(f"✗ Failed to save detections: {e}")
            return False
    
    def get_video(self, video_id: str) -> Optional[Dict[Any, Any]]:
        """
        Get video record from database
        """
        try:
            response = self.table.get_item(Key={'video_id': video_id})
            return response.get('Item')
            
        except ClientError as e:
            print(f"✗ Failed to get video: {e}")
            return None