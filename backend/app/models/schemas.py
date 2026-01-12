from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from app.models.models import UserRole

# Auth & User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: str
    location: str
    date: datetime
    capacity: int

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Capacity must be at least 1")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc) if v.tzinfo is not None else datetime.now()
        if v <= now:
            raise ValueError("Event date must be in the future")
        return v

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    date: Optional[datetime] = None
    capacity: Optional[int] = None

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Capacity must be at least 1")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.now(timezone.utc) if v.tzinfo is not None else datetime.now()
            if v <= now:
                raise ValueError("Event date must be in the future")
        return v

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    location: str
    date: datetime
    capacity: int
    organizer_id: int
    created_at: Optional[datetime] = None
    registered_count: int = 0
    is_registered: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class SearchQuery(BaseModel):
    query: str
    top_k: int = 10
