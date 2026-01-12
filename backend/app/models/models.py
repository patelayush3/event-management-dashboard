import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ORGANIZER = "organizer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    events = relationship("Event", back_populates="organizer", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="user", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organizer = relationship("User", back_populates="events")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
