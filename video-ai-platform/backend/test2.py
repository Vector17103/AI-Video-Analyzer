import boto3
import os
from dotenv import load_dotenv

load_dotenv()

print("=== Environment Variables ===")
print("AWS_ACCESS_KEY_ID:", os.getenv('AWS_ACCESS_KEY_ID'))
print("AWS_SECRET_ACCESS_KEY:", "SET" if os.getenv('AWS_SECRET_ACCESS_KEY') else "NOT SET")
print("AWS_REGION:", os.getenv('AWS_REGION'))
print("S3_BUCKET:", os.getenv('S3_BUCKET'))
print("S3_BUCKET_NAME:", os.getenv('S3_BUCKET_NAME'))

print("\n=== Testing S3 Access ===")
s3 = boto3.client('s3', region_name='us-east-2')

# Test 1: Can we list buckets?
try:
    response = s3.list_buckets()
    print("✓ Can list buckets")
    for bucket in response['Buckets']:
        print(f"  - {bucket['Name']}")
except Exception as e:
    print(f"✗ Cannot list buckets: {e}")

# Test 2: Can we access the specific video?
try:
    response = s3.head_object(
        Bucket='video-ai-uploads',
        Key='uploads/715bc540-9011-700e-3d51-6b606f199e7b/156b4e92-a79e-482b-a4c8-7bf7168d0225.mp4'
    )
    print("\n✓ Can access specific video!")
    print(f"  Content-Type: {response.get('ContentType')}")
    print(f"  Size: {response.get('ContentLength')} bytes")
except Exception as e:
    print(f"\n✗ Cannot access video: {e}")

exit()