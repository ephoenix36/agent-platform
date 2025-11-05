"""
Database Models for Multi-Tenant AI Agent Platform
User → Platform → Project → Agents/Workflows architecture
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL - supports multiple backends (SQLite for dev, PostgreSQL for prod)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agent_platform.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    """User model - represents a platform user"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platforms = relationship("Platform", back_populates="owner")
    memberships = relationship("PlatformMember", back_populates="user")

class Platform(Base):
    """Platform model - represents a user's platform/sub-platform"""
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    database_connection = Column(JSON)  # {"type": "supabase|postgres|mysql", "url": "...", "credentials": {...}}
    settings = Column(JSON, default=dict)  # Platform-wide settings
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="platforms")
    members = relationship("PlatformMember", back_populates="user")
    projects = relationship("Project", back_populates="platform")
    agents = relationship("Agent", back_populates="platform")
    workflows = relationship("Workflow", back_populates="platform")

class PlatformMember(Base):
    """Platform membership model"""
    __tablename__ = "platform_members"

    id = Column(Integer, primary_key=True, index=True)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # owner, admin, member, viewer
    invited_by = Column(Integer, ForeignKey("users.id"))
    invited_at = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime)

    # Relationships
    platform = relationship("Platform", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Project(Base):
    """Project model - represents a project within a platform"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    settings = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platform = relationship("Platform", back_populates="projects")
    agents = relationship("Agent", back_populates="project")
    workflows = relationship("Workflow", back_populates="project")
    documents = relationship("Document", back_populates="project")

class Agent(Base):
    """Agent model - represents an AI agent"""
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    system_prompt = Column(Text)
    model = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    parameters = Column(JSON, default=dict)  # temperature, max_tokens, etc.
    tools = Column(JSON, default=list)  # Available tools
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platform = relationship("Platform", back_populates="agents")
    project = relationship("Project", back_populates="agents")
    executions = relationship("AgentExecution", back_populates="agent")

class Workflow(Base):
    """Workflow model - represents a workflow"""
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    definition = Column(JSON)  # Workflow definition (nodes, edges, etc.)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platform = relationship("Platform", back_populates="workflows")
    project = relationship("Project", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow")

class AgentExecution(Base):
    """Agent execution tracking"""
    __tablename__ = "agent_executions"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    status = Column(String, default="running")  # running, completed, failed
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    token_usage = Column(JSON)
    cost = Column(Float, default=0.0)
    latency_ms = Column(Float)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    agent = relationship("Agent", back_populates="executions")

class WorkflowExecution(Base):
    """Workflow execution tracking"""
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status = Column(String, default="running")  # running, completed, failed
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")

class Document(Base):
    """Document model"""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    content = Column(Text)
    file_path = Column(String)
    mime_type = Column(String)
    document_metadata = Column(JSON, default=dict)
    platform_id = Column(Integer, ForeignKey("platforms.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platform = relationship("Platform")
    project = relationship("Project", back_populates="documents")

# Create tables
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully!")