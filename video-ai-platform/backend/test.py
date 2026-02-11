import boto3
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Check what credentials are loaded
print("AWS_ACCESS_KEY_ID:", os.getenv('AWS_ACCESS_KEY_ID')[:10] + "..." if os.getenv('AWS_ACCESS_KEY_ID') else "NOT SET")
print("AWS_SECRET_ACCESS_KEY:", "SET" if os.getenv('AWS_SECRET_ACCESS_KEY') else "NOT SET")
print("AWS_REGION:", os.getenv('AWS_REGION'))

# Create S3 client
s3 = boto3.client('s3', region_name='us-east-2')

# Test 1: Can we list buckets?
try:
    buckets = s3.list_buckets()
    print("\n✓ Can list buckets:")
    for bucket in buckets['Buckets']:
        print(f"  - {bucket['Name']}")
except Exception as e:
    print(f"\n✗ Cannot list buckets: {e}")

# Test 2: Can we access a specific video?
try:
    response = s3.head_object(
        Bucket='video-ai-uploads',
        Key='uploads/715bc540-9011-700e-3d51-6b606f199e7b/93c880f5-0859-4126-8f1c-379d3774d6c6.mp4'
    )
    print("\n✓ Can access video file!")
    print(f"  Size: {response['ContentLength']} bytes")
except Exception as e:
    print(f"\n✗ Cannot access video: {e}")

exit()