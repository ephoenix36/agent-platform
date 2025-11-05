"""
Authentication and Authorization System
Multi-tenant auth with FastAPI Users
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import BearerTransport, JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from typing import Optional
from pydantic import BaseModel

from models import User, get_db

# Database setup
DATABASE_URL = "sqlite:///./agent_platform.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# FastAPI Users setup
SECRET = "your-secret-key-here-change-in-production"

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

fastapi_users = FastAPIUsers(
    get_user_db,
    [BearerTransport(tokenUrl="auth/jwt/login")],
    get_jwt_strategy,
)

# Auth dependencies
current_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)

# Platform/tenant dependencies
def get_current_platform(platform_id: int, db: Session = Depends(get_db)):
    """Get platform and verify user has access"""
    # This would check if user is member/owner of platform
    # For now, return a mock platform
    return {"id": platform_id, "name": f"Platform {platform_id}"}

def get_current_project(project_id: int, platform_id: int, db: Session = Depends(get_db)):
    """Get project and verify it belongs to platform"""
    # This would check project belongs to platform
    # For now, return a mock project
    return {"id": project_id, "name": f"Project {project_id}", "platform_id": platform_id}

# Auth routes
auth_router = fastapi_users.get_auth_router()
users_router = fastapi_users.get_users_router()
register_router = fastapi_users.get_register_router()