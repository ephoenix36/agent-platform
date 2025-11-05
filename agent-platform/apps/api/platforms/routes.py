"""
Platform Management API
Create and manage multi-tenant platforms
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from database.models import Platform, PlatformMember, Project, PlatformType, UserRole, User
from auth.auth_system import current_active_user, get_async_session

router = APIRouter(prefix="/api/platforms", tags=["platforms"])

# Pydantic models
class PlatformCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    platform_type: PlatformType = PlatformType.PERSONAL
    settings: Optional[dict] = {}
    database_connection: Optional[dict] = None

class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None
    database_connection: Optional[dict] = None
    custom_domain: Optional[str] = None
    require_verification: Optional[bool] = None
    allow_anonymous: Optional[bool] = None

class PlatformResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    platform_type: PlatformType
    owner_id: str
    settings: dict
    max_members: int
    max_agents: int
    max_workflows: int
    max_projects: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class MemberInvite(BaseModel):
    email: str
    role: UserRole = UserRole.MEMBER
    permissions: Optional[dict] = {}

# Routes
@router.post("/", response_model=PlatformResponse)
async def create_platform(
    platform_data: PlatformCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new platform"""
    # Check if slug is unique
    result = await session.execute(
        select(Platform).where(Platform.slug == platform_data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Platform slug already exists"
        )
    
    # Set limits based on platform type
    limits = {
        PlatformType.PERSONAL: {"members": 1, "agents": 10, "workflows": 10, "projects": 5},
        PlatformType.TEAM: {"members": 10, "agents": 50, "workflows": 50, "projects": 20},
        PlatformType.ENTERPRISE: {"members": 999, "agents": 999, "workflows": 999, "projects": 999},
        PlatformType.COMMUNITY: {"members": 999, "agents": 100, "workflows": 100, "projects": 50},
    }
    
    limit = limits.get(platform_data.platform_type, limits[PlatformType.PERSONAL])
    
    # Create platform
    platform = Platform(
        id=str(uuid.uuid4()),
        name=platform_data.name,
        slug=platform_data.slug,
        description=platform_data.description,
        platform_type=platform_data.platform_type,
        owner_id=user.id,
        settings=platform_data.settings,
        database_connection=platform_data.database_connection,
        max_members=limit["members"],
        max_agents=limit["agents"],
        max_workflows=limit["workflows"],
        max_projects=limit["projects"],
    )
    
    session.add(platform)
    
    # Add owner as first member
    member = PlatformMember(
        id=str(uuid.uuid4()),
        platform_id=platform.id,
        user_id=user.id,
        role=UserRole.OWNER,
    )
    session.add(member)
    
    await session.commit()
    await session.refresh(platform)
    
    return platform

@router.get("/", response_model=List[PlatformResponse])
async def list_platforms(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """List all platforms the user has access to"""
    # Get platforms where user is a member
    result = await session.execute(
        select(Platform)
        .join(PlatformMember)
        .where(PlatformMember.user_id == user.id)
        .where(Platform.is_active == True)
    )
    
    platforms = result.scalars().all()
    return platforms

@router.get("/{platform_id}", response_model=PlatformResponse)
async def get_platform(
    platform_id: str,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get a specific platform"""
    # Check if user has access
    result = await session.execute(
        select(Platform)
        .join(PlatformMember)
        .where(Platform.id == platform_id)
        .where(PlatformMember.user_id == user.id)
        .where(Platform.is_active == True)
    )
    
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform not found"
        )
    
    return platform

@router.patch("/{platform_id}", response_model=PlatformResponse)
async def update_platform(
    platform_id: str,
    update_data: PlatformUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update platform settings"""
    # Get platform and check permissions
    result = await session.execute(
        select(Platform)
        .join(PlatformMember)
        .where(Platform.id == platform_id)
        .where(PlatformMember.user_id == user.id)
        .where(PlatformMember.role.in_([UserRole.OWNER, UserRole.ADMIN]))
    )
    
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this platform"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(platform, key, value)
    
    await session.commit()
    await session.refresh(platform)
    
    return platform

@router.post("/{platform_id}/members")
async def invite_member(
    platform_id: str,
    invite_data: MemberInvite,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Invite a user to the platform"""
    # Check if user has permission to invite
    result = await session.execute(
        select(PlatformMember)
        .where(PlatformMember.platform_id == platform_id)
        .where(PlatformMember.user_id == user.id)
        .where(PlatformMember.role.in_([UserRole.OWNER, UserRole.ADMIN]))
    )
    
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to invite members"
        )
    
    # Find user by email
    result = await session.execute(
        select(User).where(User.email == invite_data.email)
    )
    invited_user = result.scalar_one_or_none()
    
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. They must create an account first."
        )
    
    # Check if already a member
    result = await session.execute(
        select(PlatformMember)
        .where(PlatformMember.platform_id == platform_id)
        .where(PlatformMember.user_id == invited_user.id)
    )
    
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member"
        )
    
    # Add member
    new_member = PlatformMember(
        id=str(uuid.uuid4()),
        platform_id=platform_id,
        user_id=invited_user.id,
        role=invite_data.role,
        permissions=invite_data.permissions,
    )
    
    session.add(new_member)
    await session.commit()
    
    return {"message": "Member invited successfully", "member_id": new_member.id}

@router.delete("/{platform_id}")
async def delete_platform(
    platform_id: str,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Delete a platform (soft delete)"""
    # Only owner can delete
    result = await session.execute(
        select(Platform)
        .where(Platform.id == platform_id)
        .where(Platform.owner_id == user.id)
    )
    
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform owner can delete it"
        )
    
    platform.is_active = False
    await session.commit()
    
    return {"message": "Platform deleted successfully"}
