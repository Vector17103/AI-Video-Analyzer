"""
Worker Main - Entry point for video processing worker  
"""

import os
import time
import traceback
from config import settings
from sqs_handler import SQSHandler
from s3_handler import S3Handler
from db_handler import DBHandler
from processor import UltimateVideoProcessor as VideoProcessor

def extract_video_id_from_key(s3_key: str) -> str:
    """
    Extract video ID from S3 key
    Example: uploads/user-123/abc-def-ghi.mp4 -> abc-def-ghi
    """
    filename = os.path.basename(s3_key)
    video_id = os.path.splitext(filename)[0]
    return video_id

def extract_user_id_from_key(s3_key: str) -> str:
    """
    Extract user ID from S3 key
    Example: uploads/user-id/video.mp4 -> user-id
    Example: uploads/video.mp4 -> test-user
    """
    parts = s3_key.split('/')
    if len(parts) >= 3:  # uploads/user-id/video.mp4
        return parts[1]
    elif len(parts) >= 2:  # uploads/video.mp4
        return 'test-user'  # Default for manual uploads
    return 'unknown'

def process_message(message, sqs, s3, db, processor):
    """
    Process a single SQS message
    """
    print("\n" + "="*60)
    print("Processing new message...")
    print("="*60)
    
    try:
        # Parse S3 event
        event = sqs.parse_s3_event(message['Body'])
        if not event:
            print("✗ Failed to parse message")
            return False
        
        s3_key = event['s3_key']
        video_id = extract_video_id_from_key(s3_key)
        user_id = extract_user_id_from_key(s3_key)
        
        print(f"\nVideo ID: {video_id}")
        print(f"User ID: {user_id}")
        print(f"S3 Key: {s3_key}")
        print(f"Size: {event['size']} bytes")
        
        # Create temp directory
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        
        # Local file paths
        local_video = os.path.join(settings.TEMP_DIR, f"{video_id}.mp4")
        local_results = os.path.join(settings.TEMP_DIR, f"{video_id}_results.json")
        
        # Step 1: Create database record (idempotency check)
        if not db.create_video_record(video_id, user_id, s3_key):
            print("Video already processed (idempotency)")
            return True
        
        # Step 2: Update status to processing
        db.update_status(video_id, 'processing')
        
        # Step 3: Download video from S3
        if not s3.download_video(s3_key, local_video):
            db.update_status(video_id, 'failed', 'Failed to download video')
            return False
        
        # Step 4: Process video with YOLOv8
        try:
            results = processor.process_video(local_video, video_id)
            processor.save_results_to_file(results, local_results)
        except Exception as e:
            print(f"✗ Processing failed: {e}")
            db.update_status(video_id, 'failed', str(e))
            return False
        
        # Step 5: Upload results to S3
        results_s3_key = f"results/{video_id}/detections.json"
        if not s3.upload_results(local_results, results_s3_key):
            db.update_status(video_id, 'failed', 'Failed to upload results')
            return False
        
        # Step 6: Convert results for DynamoDB (floats -> Decimals)
        db_compatible_results = processor.prepare_for_dynamodb(results)
        
        # Step 7: Save detections to database
        db.save_detections(
            video_id,
            db_compatible_results['detections'],
            db_compatible_results['metadata']
        )
        
        # Step 8: Cleanup
        if os.path.exists(local_video):
            os.remove(local_video)
        if os.path.exists(local_results):
            os.remove(local_results)
        
        print("\n✓ Processing completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Error processing message: {e}")
        traceback.print_exc()
        
        # Update database with error
        try:
            db.update_status(video_id, 'failed', str(e))
        except:
            pass
        
        return False

def main():
    """
    Main worker loop
    """
    print("="*60)
    print("Video Processing Worker Starting...")
    print("="*60)
    
    # Initialize handlers
    sqs = SQSHandler()
    s3 = S3Handler()
    db = DBHandler()
    processor = VideoProcessor()
    
    print("\n✓ All handlers initialized")
    print(f"Queue URL: {settings.SQS_QUEUE_URL}")
    print(f"S3 Bucket: {settings.S3_BUCKET_NAME}")
    print(f"DynamoDB Table: {settings.DYNAMODB_TABLE_NAME}")
    print("\nWaiting for messages...")
    
    # Main processing loop
    while True:
        try:
            # Receive messages from SQS (long polling - 20 seconds)
            messages = sqs.receive_messages(max_messages=1, wait_time=20)
            
            if not messages:
                print(".", end="", flush=True)  # Show we're still running
                continue
            
            # Process each message
            for message in messages:
                success = process_message(message, sqs, s3, db, processor)
                
                # Delete message from queue if successful
                if success:
                    sqs.delete_message(message['ReceiptHandle'])
                else:
                    print("✗ Message processing failed, will retry later")
            
            print("\nWaiting for next message...")
            
        except KeyboardInterrupt:
            print("\n\nShutting down worker...")
            break
        except Exception as e:
            print(f"\n✗ Unexpected error: {e}")
            traceback.print_exc()
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    main()