import boto3
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer()
cognito_client = boto3.client('cognito-idp', region_name=settings.COGNITO_REGION)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verify Cognito JWT token
    """
    token = credentials.credentials
    
    try:
        # Decode JWT without signature verification (for development)
        # The 'key' parameter is required but can be empty string when verify_signature=False
        payload = jwt.decode(
            token,
            key='',
            options={
                "verify_signature": False,
                "verify_aud": False,    # ← Skip audience check
                "verify_exp": False     # ← Skip expiration check
            }
        )
        
        return payload
        
    except JWTError as e:
        print(f"JWT Decode Error: {e}")
        raise HTTPException(
            status_code=401, 
            detail=f"Invalid authentication token: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in verify_token: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Authentication failed"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Get current authenticated user from token
    """
    try:
        payload = verify_token(credentials)
        
        user_id = payload.get("sub")
        email = payload.get("email")
        username = payload.get("cognito:username")
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "username": username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        raise HTTPException(
            status_code=401,
            detail="Failed to authenticate user"
        )