from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # AWS Configuration
    AWS_REGION: str = "us-east-2"
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET_NAME: str
    
    # Cognito Configuration
    COGNITO_USER_POOL_ID: str = "us-east-2_EXhaj2knX"
    COGNITO_APP_CLIENT_ID: str = "53322vb71fe8qeicbl5096fugn"
    COGNITO_REGION: str = "us-east-2"
    
    # App Configuration
    UPLOAD_EXPIRATION: int = 600
    MAX_FILE_SIZE: int = 500 * 1024 * 1024
    
    # DynamoDB Configuration (ADD THIS)
    DYNAMODB_TABLE_NAME: str = "video-detections"
    
    model_config = ConfigDict(
        env_file=".env",
        extra='ignore'
    )

settings = Settings()