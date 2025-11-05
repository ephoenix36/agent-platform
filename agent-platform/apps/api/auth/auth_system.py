"""
Authentication System
User registration, login, and session management
"""

from fastapi import Depends, Request
from fastapi_users import FastAPIUsers, models
from fastapi_users.authentication import JWTStrategy, AuthenticationBackend, BearerTransport
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from typing import Optional
from datetime import datetime
import uuid

from database.models import User as UserModel

# SQLite async database for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./platform.db")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# User database
async def get_async_session():
    async with async_session_maker() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, UserModel)

# JWT bearer transport
bearer_transport = BearerTransport(tokenUrl="auth/login")

SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600 * 24 * 7)  # 7 days

# Authentication backend
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# FastAPI Users instance
fastapi_users = FastAPIUsers(
    get_user_db,
    [auth_backend],
)

# Get current user dependency
current_user = fastapi_users.current_user()
current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)

# Router generators
auth_router = fastapi_users.get_auth_router(auth_backend)
register_router = fastapi_users.get_register_router()
users_router = fastapi_users.get_users_router()
verify_router = fastapi_users.get_verify_router()
reset_password_router = fastapi_users.get_reset_password_router()
