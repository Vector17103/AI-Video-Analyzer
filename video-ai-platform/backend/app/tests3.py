#!/usr/bin/env python3
"""
Test S3 Connection
Run this to verify your AWS credentials and S3 bucket are configured correctly
"""

import sys
import os

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import boto3
    from app.config import settings
    
    print("=" * 50)
    print("Testing AWS S3 Connection")
    print("=" * 50)
    
    print(f"\nConfiguration:")
    print(f"  Region: {settings.AWS_REGION}")
    print(f"  Bucket: {settings.S3_BUCKET_NAME}")
    print(f"  Access Key: {settings.AWS_ACCESS_KEY_ID[:10]}...")
    print(f"  Secret Key: {settings.AWS_SECRET_ACCESS_KEY[:10]}...")
    
    print("\n1. Creating S3 client...")
    s3_client = boto3.client(
        's3',
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    print("   ✓ S3 client created")
    
    print("\n2. Testing credentials by listing buckets...")
    response = s3_client.list_buckets()
    bucket_names = [b['Name'] for b in response['Buckets']]
    print(f"   ✓ Credentials valid! Found {len(bucket_names)} bucket(s)")
    print(f"   Buckets: {', '.join(bucket_names)}")
    
    print(f"\n3. Checking if bucket '{settings.S3_BUCKET_NAME}' exists...")
    if settings.S3_BUCKET_NAME in bucket_names:
        print(f"   ✓ Bucket '{settings.S3_BUCKET_NAME}' exists!")
    else:
        print(f"   ✗ Bucket '{settings.S3_BUCKET_NAME}' NOT FOUND!")
        print(f"   Available buckets: {', '.join(bucket_names)}")
        sys.exit(1)
    
    print(f"\n4. Testing access to bucket...")
    s3_client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
    print(f"   ✓ Can access bucket!")
    
    print(f"\n5. Testing pre-signed URL generation...")
    test_key = "test/test-upload.mp4"
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': settings.S3_BUCKET_NAME,
            'Key': test_key,
            'ContentType': 'video/mp4',
        },
        ExpiresIn=600
    )
    print(f"   ✓ Pre-signed URL generated successfully!")
    print(f"   URL: {presigned_url[:80]}...")
    
    print("\n" + "=" * 50)
    print("✓ ALL TESTS PASSED!")
    print("Your S3 configuration is working correctly.")
    print("=" * 50)
    
except ImportError as e:
    print(f"\n✗ Import error: {e}")
    print("Make sure you're running this from the backend directory")
    print("and that the virtual environment is activated.")
    sys.exit(1)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print(f"\nError type: {type(e).__name__}")
    print("\nPossible causes:")
    print("  1. AWS credentials are incorrect")
    print("  2. AWS credentials have expired")
    print("  3. S3 bucket name is wrong")
    print("  4. AWS region is incorrect")
    print("  5. IAM user doesn't have S3 permissions")
    print("\nCheck your .env file and AWS IAM settings.")
    sys.exit(1)