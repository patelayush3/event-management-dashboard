from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import models
from app.services.search import index_event

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if users exist
        organizer = db.query(models.User).filter(models.User.email == "organizer@example.com").first()
        if not organizer:
            organizer = models.User(
                email="organizer@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Tech (Organizer)",
                role=models.UserRole.ORGANIZER
            )
            db.add(organizer)
            db.commit()
            db.refresh(organizer)
            print("Created default organizer: organizer@example.com / password123")

        user = db.query(models.User).filter(models.User.email == "user@example.com").first()
        if not user:
            user = models.User(
                email="user@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Sam Attendee",
                role=models.UserRole.USER
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("Created default user: user@example.com / password123")

        # Check sample events
        if db.query(models.Event).count() == 0:
            now = datetime.now(timezone.utc)
            events_data = [
                {
                    "title": "AI & Large Language Models Summit 2026",
                    "description": "Comprehensive workshop on building autonomous AI agents, fine-tuning LLMs, vector database embeddings, and RAG architectures.",
                    "location": "San Francisco Tech Center / Hybrid",
                    "date": now + timedelta(days=5, hours=10),
                    "capacity": 100,
                },
                {
                    "title": "React & Next.js Advanced Architecture",
                    "description": "Master server components, streaming SSR, modern state management, and web performance optimization for large scale applications.",
                    "location": "Online via Zoom",
                    "date": now + timedelta(days=12, hours=14),
                    "capacity": 250,
                },
                {
                    "title": "Tech Founders & Angel Investor Mixer",
                    "description": "Exclusive networking evening for startup founders, venture capitalists, and software engineers looking for technical co-founders.",
                    "location": "Downtown Innovation Hub",
                    "date": now + timedelta(days=20, hours=18),
                    "capacity": 50,
                },
            ]

            for evt in events_data:
                event_obj = models.Event(
                    title=evt["title"],
                    description=evt["description"],
                    location=evt["location"],
                    date=evt["date"],
                    capacity=evt["capacity"],
                    organizer_id=organizer.id
                )
                db.add(event_obj)
                db.commit()
                db.refresh(event_obj)
                # Index in search
                try:
                    index_event(event_obj.id, event_obj.title, event_obj.description)
                except Exception as e:
                    print(f"Warning: Seed indexing failed for {event_obj.id}: {e}")
                print(f"Created event: {event_obj.title} (ID: {event_obj.id})")

            # Add default registration
            first_event = db.query(models.Event).first()
            if first_event:
                reg = models.Registration(user_id=user.id, event_id=first_event.id)
                db.add(reg)
                db.commit()
                print(f"Registered user {user.email} for event {first_event.title}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
