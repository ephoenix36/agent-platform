"""
Advanced Authentication System
Multi-provider OAuth, Email/SMS verification, Multiple identities
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
import hashlib
import os
import secrets
import re

# Router
auth_router = APIRouter(prefix="/auth", tags=["authentication"])
users_router = APIRouter(prefix="/users", tags=["users"])
identities_router = APIRouter(prefix="/identities", tags=["identities"])

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production-make-it-very-long-and-random")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing (simple SHA256 for development - use bcrypt in production)
def hash_password(password: str) -> str:
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return hash_password(plain_password) == hashed_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Enhanced user database with multiple identities support
# In production, use PostgreSQL with proper relationships
fake_users_db = {}
fake_identities_db = {}
fake_oauth_links_db = {}
fake_verification_codes_db = {}

# Initialize with admin user
admin_password_hash = hash_password("admin123")
fake_users_db["admin@platform.com"] = {
    "id": "1",
    "email": "admin@platform.com",
    "username": "admin",
    "full_name": "Platform Admin",
    "hashed_password": admin_password_hash,
    "is_active": True,
    "is_verified": True,
    "is_superuser": True,
    "phone_number": None,
    "phone_verified": False,
    "created_at": datetime.now().isoformat(),
    "default_identity_id": "identity_1",
}

# Default admin identity
fake_identities_db["identity_1"] = {
    "id": "identity_1",
    "user_id": "1",
    "display_name": "Platform Admin",
    "avatar_url": None,
    "bio": "System Administrator",
    "is_default": True,
    "visibility": "public",  # public, friends, private
    "created_at": datetime.now().isoformat(),
}

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    phone_verified: bool
    default_identity_id: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerificationRequest(BaseModel):
    email: EmailStr
    code: str
    verification_type: str = "email"  # email or sms

class PhoneVerificationRequest(BaseModel):
    phone_number: str

class IdentityBase(BaseModel):
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    visibility: str = "public"  # public, friends, private

class IdentityCreate(IdentityBase):
    pass

class IdentityResponse(IdentityBase):
    id: str
    user_id: str
    is_default: bool
    created_at: str

class OAuthLinkRequest(BaseModel):
    provider: str  # google, github, apple
    provider_user_id: str
    provider_email: str
    access_token: str

# Helper functions
def get_password_hash(password: str) -> str:
    """Hash a password"""
    return hash_password(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(email: str):
    """Get user by email"""
    if email in fake_users_db:
        return fake_users_db[email]
    return None

def get_user_by_id(user_id: str):
    """Get user by ID"""
    for user in fake_users_db.values():
        if user["id"] == user_id:
            return user
    return None

def authenticate_user(email: str, password: str):
    """Authenticate a user"""
    user = get_user(email)
    if not user:
        print(f"[AUTH] User not found: {email}")
        return False
    if not verify_password(password, user["hashed_password"]):
        print(f"[AUTH] Password mismatch for user: {email}")
        return False
    print(f"[AUTH] Authentication successful: {email}")
    return user

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(secrets.randbelow(1000000)).zfill(6)

def send_email_verification(email: str, code: str):
    """Send verification email (mock implementation)"""
    print(f"[EMAIL] Verification code for {email}: {code}")
    # In production: integrate with SendGrid, AWS SES, etc.
    return True

def send_sms_verification(phone: str, code: str):
    """Send verification SMS (mock implementation)"""
    print(f"[SMS] Verification code for {phone}: {code}")
    # In production: integrate with Twilio, AWS SNS, etc.
    return True

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = get_user(email)
    if user is None:
        raise credentials_exception
    return user

# Auth routes
@auth_router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    """Register a new user"""
    # Check if user exists
    if user.email in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = str(len(fake_users_db) + 1)
    identity_id = f"identity_{user_id}"
    
    new_user = {
        "id": user_id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": get_password_hash(user.password),
        "is_active": True,
        "is_verified": False,  # Requires email verification
        "is_superuser": False,
        "phone_number": user.phone_number,
        "phone_verified": False,
        "created_at": datetime.now().isoformat(),
        "default_identity_id": identity_id,
    }
    
    fake_users_db[user.email] = new_user
    
    # Create default identity
    fake_identities_db[identity_id] = {
        "id": identity_id,
        "user_id": user_id,
        "display_name": user.full_name or user.username,
        "avatar_url": None,
        "bio": None,
        "is_default": True,
        "visibility": "public",
        "created_at": datetime.now().isoformat(),
    }
    
    # Send verification email
    verification_code = generate_verification_code()
    fake_verification_codes_db[user.email] = {
        "code": verification_code,
        "type": "email",
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(hours=24),
    }
    
    background_tasks.add_task(send_email_verification, user.email, verification_code)
    
    return UserResponse(**new_user)

@auth_router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password"""
    print(f"[AUTH] Login attempt for: {form_data.username}")
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    print(f"[AUTH] Login successful for: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login/json", response_model=Token)
async def login_json(login_data: LoginRequest):
    """Login with JSON body (for frontend)"""
    print(f"[AUTH] JSON Login attempt for: {login_data.email}")
    user = authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    print(f"[AUTH] JSON Login successful for: {login_data.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/verify-email")
async def verify_email(verification: VerificationRequest):
    """Verify email with code"""
    if verification.email not in fake_verification_codes_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found"
        )
    
    stored = fake_verification_codes_db[verification.email]
    
    # Check expiration
    if datetime.now() > stored["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired"
        )
    
    # Check code
    if stored["code"] != verification.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Mark user as verified
    user = get_user(verification.email)
    if user:
        user["is_verified"] = True
        del fake_verification_codes_db[verification.email]
        return {"message": "Email verified successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )

@auth_router.post("/send-verification")
async def send_verification(email: EmailStr, background_tasks: BackgroundTasks):
    """Resend verification email"""
    user = get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user["is_verified"]:
        return {"message": "Email already verified"}
    
    # Generate and send new code
    verification_code = generate_verification_code()
    fake_verification_codes_db[email] = {
        "code": verification_code,
        "type": "email",
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(hours=24),
    }
    
    background_tasks.add_task(send_email_verification, email, verification_code)
    
    return {"message": "Verification email sent"}

# OAuth routes
@auth_router.post("/oauth/link")
async def link_oauth_account(
    oauth_data: OAuthLinkRequest,
    current_user: dict = Depends(get_current_user)
):
    """Link an OAuth provider account to user account"""
    link_id = f"{oauth_data.provider}_{oauth_data.provider_user_id}"
    
    # Check if this OAuth account is already linked
    if link_id in fake_oauth_links_db:
        existing_link = fake_oauth_links_db[link_id]
        if existing_link["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This {oauth_data.provider} account is already linked to another user"
            )
        return {"message": "Account already linked"}
    
    # Create new link
    fake_oauth_links_db[link_id] = {
        "id": link_id,
        "user_id": current_user["id"],
        "provider": oauth_data.provider,
        "provider_user_id": oauth_data.provider_user_id,
        "provider_email": oauth_data.provider_email,
        "linked_at": datetime.now().isoformat(),
    }
    
    return {"message": f"{oauth_data.provider} account linked successfully"}

@auth_router.get("/oauth/accounts")
async def get_linked_accounts(current_user: dict = Depends(get_current_user)):
    """Get all OAuth accounts linked to current user"""
    linked_accounts = [
        {
            "provider": link["provider"],
            "provider_email": link["provider_email"],
            "linked_at": link["linked_at"],
        }
        for link in fake_oauth_links_db.values()
        if link["user_id"] == current_user["id"]
    ]
    
    return {"accounts": linked_accounts}

# User routes
@users_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user)

@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id_route(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user)

# Identity routes
@identities_router.post("/", response_model=IdentityResponse)
async def create_identity(
    identity_data: IdentityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new identity for current user"""
    identity_id = f"identity_{len(fake_identities_db) + 1}"
    
    new_identity = {
        "id": identity_id,
        "user_id": current_user["id"],
        "display_name": identity_data.display_name,
        "avatar_url": identity_data.avatar_url,
        "bio": identity_data.bio,
        "is_default": False,
        "visibility": identity_data.visibility,
        "created_at": datetime.now().isoformat(),
    }
    
    fake_identities_db[identity_id] = new_identity
    
    return IdentityResponse(**new_identity)

@identities_router.get("/", response_model=List[IdentityResponse])
async def get_my_identities(current_user: dict = Depends(get_current_user)):
    """Get all identities for current user"""
    identities = [
        IdentityResponse(**identity)
        for identity in fake_identities_db.values()
        if identity["user_id"] == current_user["id"]
    ]
    
    return identities

@identities_router.get("/{identity_id}", response_model=IdentityResponse)
async def get_identity(identity_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific identity"""
    identity = fake_identities_db.get(identity_id)
    if not identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Identity not found"
        )
    
    # Check if user owns this identity or if it's public
    if identity["user_id"] != current_user["id"] and identity["visibility"] == "private":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return IdentityResponse(**identity)

@identities_router.put("/{identity_id}/set-default")
async def set_default_identity(
    identity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Set an identity as the default"""
    identity = fake_identities_db.get(identity_id)
    if not identity or identity["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Identity not found"
        )
    
    # Unset all other identities as default
    for ident in fake_identities_db.values():
        if ident["user_id"] == current_user["id"]:
            ident["is_default"] = False
    
    # Set this identity as default
    identity["is_default"] = True
    current_user["default_identity_id"] = identity_id
    
    return {"message": "Default identity updated"}

@identities_router.delete("/{identity_id}")
async def delete_identity(
    identity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an identity"""
    identity = fake_identities_db.get(identity_id)
    if not identity or identity["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Identity not found"
        )
    
    # Prevent deleting default identity
    if identity["is_default"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default identity. Set another identity as default first."
        )
    
    # Delete the identity
    del fake_identities_db[identity_id]
    
    return {"message": "Identity deleted successfully"}

# Current user dependency (for use in other routes)
current_active_user = get_current_user
