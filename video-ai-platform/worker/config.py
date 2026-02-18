from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # AWS Configuration
    AWS_REGION: str = "us-east-2"
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    
    # S3 Configuration
    S3_BUCKET_NAME: str
    
    # SQS Configuration
    SQS_QUEUE_URL: str
    
    # DynamoDB Configuration
    DYNAMODB_TABLE_NAME: str = "video-detections"
    
    # Processing Configuration
    TEMP_DIR: str = "./temp"
    MAX_VIDEO_SIZE: int = 500000000  # 500 MB
    PROCESS_EVERY_N_FRAMES: int = 2  # Process every 2nd frame
    
    model_config = ConfigDict(
        env_file=".env",
        extra='ignore'
    )

settings = Settings()