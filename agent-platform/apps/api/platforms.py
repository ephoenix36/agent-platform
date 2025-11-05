"""
Platform Management Routes
Multi-tenant platform creation and management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from models import Platform, Project, Agent, Workflow, get_db
from auth import current_user

router = APIRouter(prefix="/api/platforms", tags=["platforms"])

# Pydantic models
class PlatformCreate(BaseModel):
    name: str
    description: Optional[str] = None
    database_connection: Optional[dict] = None
    settings: Optional[dict] = None

class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    database_connection: Optional[dict] = None
    settings: Optional[dict] = None
    is_active: Optional[bool] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    settings: Optional[dict] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None
    is_active: Optional[bool] = None

# Platform routes
@router.post("/")
async def create_platform(
    platform: PlatformCreate,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Create a new platform"""
    db_platform = Platform(
        name=platform.name,
        description=platform.description,
        owner_id=user.id,
        database_connection=platform.database_connection or {},
        settings=platform.settings or {},
    )
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.get("/")
async def get_user_platforms(
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get all platforms owned by the current user"""
    platforms = db.query(Platform).filter(Platform.owner_id == user.id).all()
    return platforms

@router.get("/{platform_id}")
async def get_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get a specific platform"""
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    return platform

@router.put("/{platform_id}")
async def update_platform(
    platform_id: int,
    platform_update: PlatformUpdate,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Update a platform"""
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    for field, value in platform_update.dict(exclude_unset=True).items():
        setattr(platform, field, value)

    db.commit()
    db.refresh(platform)
    return platform

@router.delete("/{platform_id}")
async def delete_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Delete a platform"""
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    db.delete(platform)
    db.commit()
    return {"message": "Platform deleted"}

# Project routes
@router.post("/{platform_id}/projects")
async def create_project(
    platform_id: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Create a new project in a platform"""
    # Verify platform ownership
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    db_project = Project(
        name=project.name,
        description=project.description,
        platform_id=platform_id,
        settings=project.settings or {},
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{platform_id}/projects")
async def get_platform_projects(
    platform_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get all projects in a platform"""
    # Verify platform ownership
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    projects = db.query(Project).filter(Project.platform_id == platform_id).all()
    return projects

@router.get("/{platform_id}/projects/{project_id}")
async def get_project(
    platform_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get a specific project"""
    project = db.query(Project).join(Platform).filter(
        Project.id == project_id,
        Project.platform_id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Agent routes
@router.get("/{platform_id}/agents")
async def get_platform_agents(
    platform_id: int,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get all agents in a platform (optionally filtered by project)"""
    # Verify platform ownership
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    query = db.query(Agent).filter(Agent.platform_id == platform_id)
    if project_id:
        query = query.filter(Agent.project_id == project_id)

    agents = query.all()
    return agents

# Workflow routes
@router.get("/{platform_id}/workflows")
async def get_platform_workflows(
    platform_id: int,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    """Get all workflows in a platform (optionally filtered by project)"""
    # Verify platform ownership
    platform = db.query(Platform).filter(
        Platform.id == platform_id,
        Platform.owner_id == user.id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    query = db.query(Workflow).filter(Workflow.platform_id == platform_id)
    if project_id:
        query = query.filter(Workflow.project_id == project_id)

    workflows = query.all()
    return workflows