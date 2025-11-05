"""
Multi-Tenant Database Models
Comprehensive schema for platform-within-a-platform architecture
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

class PlatformType(str, enum.Enum):
    """Types of platforms"""
    PERSONAL = "personal"
    TEAM = "team"
    ENTERPRISE = "enterprise"
    COMMUNITY = "community"

class UserRole(str, enum.Enum):
    """User roles within a platform"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"
    GUEST = "guest"

class User(Base):
    """User account - can own multiple platforms"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    owned_platforms = relationship("Platform", back_populates="owner", foreign_keys="Platform.owner_id")
    platform_memberships = relationship("PlatformMember", back_populates="user")
    api_keys = relationship("APIKey", back_populates="user")

class Platform(Base):
    """Platform instance - the core tenant unit"""
    __tablename__ = "platforms"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    platform_type = Column(Enum(PlatformType), default=PlatformType.PERSONAL)
    
    # Owner
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="owned_platforms", foreign_keys=[owner_id])
    
    # Platform settings
    settings = Column(JSON, default={})  # Custom rules, branding, etc.
    database_connection = Column(JSON)  # Supabase URL, custom DB config, etc.
    
    # Features & limits
    max_members = Column(Integer, default=1)  # Based on platform type
    max_agents = Column(Integer, default=10)
    max_workflows = Column(Integer, default=10)
    max_projects = Column(Integer, default=5)
    
    # Platform rules
    require_verification = Column(Boolean, default=False)
    allow_anonymous = Column(Boolean, default=False)
    custom_domain = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    members = relationship("PlatformMember", back_populates="platform")
    projects = relationship("Project", back_populates="platform")
    agents = relationship("Agent", back_populates="platform")
    workflows = relationship("Workflow", back_populates="platform")

class PlatformMember(Base):
    """Platform membership - associates users with platforms"""
    __tablename__ = "platform_members"
    
    id = Column(String, primary_key=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    
    # Permissions
    permissions = Column(JSON, default={})  # Custom permissions
    
    # Timestamps
    joined_at = Column(DateTime, server_default=func.now())
    last_active_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    platform = relationship("Platform", back_populates="members")
    user = relationship("User", back_populates="platform_memberships")

class Project(Base):
    """Project within a platform"""
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Project data
    files = Column(JSON, default={})  # File tree/structure
    tasks = Column(JSON, default=[])  # Task list
    roadmap = Column(JSON, default={})  # Roadmap/timeline
    documentation = Column(JSON, default={})  # Docs and notes
    
    # Settings
    settings = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    platform = relationship("Platform", back_populates="projects")
    agents = relationship("Agent", back_populates="project")
    workflows = relationship("Workflow", back_populates="project")
    sessions = relationship("Session", back_populates="project")

class Agent(Base):
    """Agent within a platform"""
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"))
    
    name = Column(String, nullable=False)
    description = Column(Text)
    system_prompt = Column(Text)
    model = Column(String)  # Model ID
    
    # Agent configuration
    config = Column(JSON, default={})  # Tools, parameters, etc.
    context_rules = Column(JSON, default={})  # Context management rules
    
    # Visibility
    is_public = Column(Boolean, default=False)
    is_marketplace = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    platform = relationship("Platform", back_populates="agents")
    project = relationship("Project", back_populates="agents")

class Workflow(Base):
    """Workflow within a platform"""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"))
    
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Workflow definition
    nodes = Column(JSON, default=[])
    edges = Column(JSON, default=[])
    config = Column(JSON, default={})
    
    # Visibility
    is_public = Column(Boolean, default=False)
    is_marketplace = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    platform = relationship("Platform", back_populates="workflows")
    project = relationship("Project", back_populates="workflows")

class Session(Base):
    """Chat/interaction session"""
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    
    name = Column(String)
    type = Column(String)  # 'chat', 'canvas', 'workflow', etc.
    
    # Session state
    messages = Column(JSON, default=[])
    context = Column(JSON, default={})
    state = Column(JSON, default={})
    
    # Settings
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    last_active_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="sessions")

class APIKey(Base):
    """API keys for external integrations"""
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False)  # Hashed key
    prefix = Column(String)  # First few characters for display
    
    # Permissions
    scopes = Column(JSON, default=[])  # Allowed operations
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")

class Comment(Base):
    """Collaborative comments on various resources"""
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Resource being commented on
    resource_type = Column(String, nullable=False)  # 'file', 'document', 'agent_output', etc.
    resource_id = Column(String, nullable=False)
    
    # Comment content
    content = Column(Text, nullable=False)
    selection = Column(JSON)  # Highlighted text/area
    position = Column(JSON)  # Position in document
    
    # Threading
    parent_id = Column(String, ForeignKey("comments.id"))
    thread_id = Column(String)  # Top-level comment ID
    
    # Status
    is_resolved = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# Database initialization
def create_tables(engine):
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables(engine):
    """Drop all tables"""
    Base.metadata.drop_all(bind=engine)
