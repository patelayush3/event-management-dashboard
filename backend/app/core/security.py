import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
from jose import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hash password using PBKDF2 with SHA256 and a random 16-byte salt."""
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"pbkdf2:sha256:{salt.hex()}:{pwd_hash.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored PBKDF2 hash (with fallback support)."""
    try:
        if hashed_password.startswith("pbkdf2:sha256:"):
            parts = hashed_password.split(":")
            if len(parts) != 4:
                return False
            salt = bytes.fromhex(parts[2])
            expected_hash = bytes.fromhex(parts[3])
            computed_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            return hmac.compare_digest(expected_hash, computed_hash)
        else:
            # Basic fallback check
            return False
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
