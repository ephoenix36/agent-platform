"""
Database Models for Billing System
SQLAlchemy models for users, subscriptions, API keys, and usage tracking
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """User account model"""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    stripe_customer_id = Column(String(255), unique=True, index=True)
    
    # Profile
    company = Column(String(255))
    role = Column(String(100))
    
    # Status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    usage_records = relationship("APIUsage", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"


class Subscription(Base):
    """Stripe subscription model"""
    __tablename__ = 'subscriptions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Stripe data
    stripe_subscription_id = Column(String(255), unique=True, nullable=False, index=True)
    stripe_customer_id = Column(String(255), nullable=False)
    stripe_price_id = Column(String(255), nullable=False)
    
    # Subscription details
    status = Column(String(50), nullable=False, index=True)  # active, canceled, past_due, etc.
    tier = Column(String(50), nullable=False, index=True)  # free, pro, team, enterprise
    
    # Billing period
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    
    # Cancellation
    cancel_at_period_end = Column(Boolean, default=False)
    canceled_at = Column(DateTime)
    
    # Trial
    trial_start = Column(DateTime)
    trial_end = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_subscriptions_user_status', 'user_id', 'status'),
        Index('ix_subscriptions_tier_status', 'tier', 'status'),
    )
    
    def __repr__(self):
        return f"<Subscription {self.tier} - {self.status}>"


class APIKey(Base):
    """API key model for authentication"""
    __tablename__ = 'api_keys'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Key data (hashed)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    key_prefix = Column(String(20), nullable=False)  # For display: "sk_live_abc..."
    
    # Metadata
    name = Column(String(255))  # User-defined name
    description = Column(String(500))
    
    # Tier & Limits
    tier = Column(String(50), nullable=False, index=True)
    rate_limit_per_minute = Column(Integer, nullable=False)
    monthly_quota = Column(Integer, nullable=False)  # 0 = unlimited
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_used_at = Column(DateTime)
    
    # Security
    allowed_ips = Column(JSON)  # List of allowed IP addresses
    allowed_domains = Column(JSON)  # List of allowed domains
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime)
    expires_at = Column(DateTime)  # Optional expiration
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    usage_records = relationship("APIUsage", back_populates="api_key")
    
    # Indexes
    __table_args__ = (
        Index('ix_api_keys_user_active', 'user_id', 'is_active'),
    )
    
    def __repr__(self):
        return f"<APIKey {self.key_prefix}... - {self.tier}>"


class APIUsage(Base):
    """API usage tracking for billing and analytics"""
    __tablename__ = 'api_usage'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    api_key_id = Column(UUID(as_uuid=True), ForeignKey('api_keys.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Request details
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)  # GET, POST, etc.
    
    # Response
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    
    # Feature used
    feature = Column(String(100), index=True)  # evaluation, optimization, ood_testing, etc.
    
    # Metadata
    request_id = Column(String(100), unique=True)
    user_agent = Column(String(500))
    ip_address = Column(String(45))
    
    # Cost (for metered billing)
    cost_cents = Column(Integer, default=0)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    billing_period = Column(DateTime, nullable=False, index=True)  # For aggregation (month start)
    
    # Relationships
    api_key = relationship("APIKey", back_populates="usage_records")
    user = relationship("User", back_populates="usage_records")
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_api_usage_user_period', 'user_id', 'billing_period'),
        Index('ix_api_usage_key_period', 'api_key_id', 'billing_period'),
        Index('ix_api_usage_feature_timestamp', 'feature', 'timestamp'),
        Index('ix_api_usage_timestamp', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<APIUsage {self.endpoint} at {self.timestamp}>"


class WebhookEvent(Base):
    """Store Stripe webhook events for audit and replay"""
    __tablename__ = 'webhook_events'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Stripe event data
    stripe_event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    
    # Payload
    payload = Column(JSON, nullable=False)
    
    # Processing
    processed = Column(Boolean, default=False, index=True)
    processed_at = Column(DateTime)
    error_message = Column(String(1000))
    retry_count = Column(Integer, default=0)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Indexes
    __table_args__ = (
        Index('ix_webhook_events_type_processed', 'event_type', 'processed'),
    )
    
    def __repr__(self):
        return f"<WebhookEvent {self.event_type} - {self.stripe_event_id}>"


class UsageAggregate(Base):
    """Aggregated usage statistics for faster querying"""
    __tablename__ = 'usage_aggregates'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey('api_keys.id'), index=True)
    
    # Period
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False)
    period_type = Column(String(20), nullable=False)  # hourly, daily, monthly
    
    # Aggregates
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    
    # By feature
    feature_breakdown = Column(JSON)  # {"evaluation": 100, "optimization": 50, ...}
    
    # Performance
    avg_response_time_ms = Column(Float)
    p95_response_time_ms = Column(Float)
    p99_response_time_ms = Column(Float)
    
    # Cost
    total_cost_cents = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('ix_usage_aggregates_user_period', 'user_id', 'period_start', 'period_type'),
        Index('ix_usage_aggregates_key_period', 'api_key_id', 'period_start', 'period_type'),
    )
    
    def __repr__(self):
        return f"<UsageAggregate {self.period_type} - {self.total_requests} requests>"


# Database initialization function
def init_db(engine):
    """Create all tables"""
    Base.metadata.create_all(engine)


# Migration helper
def get_alembic_config():
    """Get Alembic configuration for migrations"""
    from alembic.config import Config
    config = Config("alembic.ini")
    return config
