"""
DynamoDB Handler for Backend API
Reads video records and detection results
"""
import boto3
from botocore.exceptions import ClientError
from app.config import settings
from typing import Optional, Dict, Any, List
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

class DBHandler:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.table = self.dynamodb.Table(settings.DYNAMODB_TABLE_NAME)
    
    def get_video_by_id(self, video_id: str) -> Optional[Dict[Any, Any]]:
        """
        Get a single video record by video_id
        """
        try:
            response = self.table.get_item(Key={'video_id': video_id})
            item = response.get('Item')
            
            if item:
                return self._deserialize_item(item)
            return None
            
        except ClientError as e:
            print(f"✗ Failed to get video: {e}")
            return None
    
    def get_videos_by_user(self, user_id: str, limit: int = 50) -> List[Dict[Any, Any]]:
        """
        Get all videos for a specific user
        Uses a scan with filter (works for small scale)
        For production with many videos, use a GSI (Global Secondary Index)
        """
        try:
            response = self.table.scan(
                FilterExpression=Attr('user_id').eq(user_id),
                Limit=limit
            )
            
            items = response.get('Items', [])
            return [self._deserialize_item(item) for item in items]
            
        except ClientError as e:
            print(f"✗ Failed to get videos: {e}")
            return []
    
    def _deserialize_item(self, item: dict) -> dict:
        """
        Convert DynamoDB Decimal types back to float for JSON serialization
        
        Why? DynamoDB stores numbers as Decimal (for precision)
        But JSON APIs need float/int for JavaScript compatibility
        """
        def convert_decimals(obj):
            if isinstance(obj, list):
                return [convert_decimals(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, Decimal):
                # Convert to int if it's a whole number, otherwise float
                if obj % 1 == 0:
                    return int(obj)
                else:
                    return float(obj)
            else:
                return obj
        
        return convert_decimals(item)