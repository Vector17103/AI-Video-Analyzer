import boto3

s3 = boto3.client('s3', region_name='us-east-2')

# Test access
try:
    s3.head_object(
        Bucket='video-ai-uploads',
        Key='uploads/715bc540-9011-700e-3d51-6b606f199e7b/156b4e92-a79e-482b-a4c8-7bf7168d0225.mp4'
    )
    print("✓ SUCCESS! S3 access works")
except Exception as e:
    print("✗ FAILED:", e)

exit()