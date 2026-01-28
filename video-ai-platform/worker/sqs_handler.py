"""
SQS Handler - Receive and delete messages from SQS queue
"""

import boto3
from botocore.exceptions import ClientError
from config import settings
import json

class SQSHandler:
    def __init__(self):
        self.sqs_client = boto3.client(
            'sqs',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.queue_url = settings.SQS_QUEUE_URL
    
    def receive_messages(self, max_messages: int = 1, wait_time: int = 20):
        """
        Receive messages from SQS queue (long polling)
        """
        try:
            response = self.sqs_client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                MessageAttributeNames=['All'],
                AttributeNames=['All']
            )
            
            messages = response.get('Messages', [])
            return messages
            
        except ClientError as e:
            print(f"Error receiving messages: {e}")
            return []
    
    def delete_message(self, receipt_handle: str) -> bool:
        """
        Delete message from queue after successful processing
        """
        try:
            self.sqs_client.delete_message(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle
            )
            print("✓ Message deleted from queue")
            return True
            
        except ClientError as e:
            print(f"✗ Failed to delete message: {e}")
            return False
    
    def parse_s3_event(self, message_body: str) -> dict:
        """
        Parse S3 event notification from SQS message
        """
        try:
            body = json.loads(message_body)
            
            # S3 events are wrapped in Records array
            if 'Records' in body:
                record = body['Records'][0]
                s3_info = record['s3']
                
                return {
                    'bucket': s3_info['bucket']['name'],
                    's3_key': s3_info['object']['key'],
                    'size': s3_info['object']['size'],
                    'event_name': record['eventName']
                }
            
            return None
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing message: {e}")
            return None