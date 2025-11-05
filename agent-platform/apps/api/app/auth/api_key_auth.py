"""
API Key Authentication & Validation
Middleware for authenticating API requests
"""

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from .models import APIKey, User
import hashlib
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


class APIKeyAuth:
    """API Key authentication handler"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def authenticate(self, api_key: str) -> tuple[APIKey, User]:
        """
        Authenticate API key and return associated key and user
        
        Args:
            api_key: API key from request
            
        Returns:
            Tuple of (APIKey, User)
            
        Raises:
            HTTPException: If authentication fails
        """
        if not api_key or not api_key.startswith('sk_'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key format"
            )
        
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Look up key in database
        api_key_record = self.db.query(APIKey).filter(
            APIKey.key_hash == key_hash,
            APIKey.is_active == True
        ).first()
        
        if not api_key_record:
            logger.warning(f"Invalid or inactive API key attempted")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API key"
            )
        
        # Check if key is expired
        if api_key_record.expires_at and api_key_record.expires_at < datetime.utcnow():
            logger.warning(f"Expired API key attempted: {api_key_record.id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )
        
        # Get associated user
        user = self.db.query(User).filter(
            User.id == api_key_record.user_id,
            User.is_active == True
        ).first()
        
        if not user:
            logger.error(f"API key {api_key_record.id} has no active user")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found or inactive"
            )
        
        # Update last used timestamp
        api_key_record.last_used_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Authenticated request for user {user.email} with key {api_key_record.key_prefix}")
        
        return api_key_record, user


async def get_api_key(
    request: Request,
    credentials: HTTPAuthorizationCredentials = security
) -> str:
    """Extract API key from request"""
    return credentials.credentials


async def require_api_key(
    request: Request,
    db: Session
) -> tuple[APIKey, User]:
    """
    Dependency for routes that require API key authentication
    
    Usage:
        @app.get("/api/protected")
        async def protected_route(auth: tuple = Depends(require_api_key)):
            api_key, user = auth
            ...
    """
    api_key = await get_api_key(request)
    auth = APIKeyAuth(db)
    return await auth.authenticate(api_key)
