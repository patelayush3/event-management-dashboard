import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base
from app.api.deps import get_db
from app.services import search

# In-memory SQLite for isolated test suite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_events.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_lazy_model_loading():
    # Verify model is None initially until get_embedding is invoked
    assert search._embedding_model is None
    vector = search.get_embedding("test event query")
    assert len(vector) == 384
    assert search._embedding_model is not None

def test_auth_register_and_login():
    # Register organizer
    res = client.post("/api/auth/register", json={
        "email": "org_test@example.com",
        "password": "password123",
        "full_name": "Test Organizer",
        "role": "organizer"
    })
    assert res.status_code == 201
    assert res.json()["email"] == "org_test@example.com"
    assert res.json()["role"] == "organizer"

    # Login
    res = client.post("/api/auth/login", json={
        "email": "org_test@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_capacity_and_date_validation():
    # Register organizer & login
    client.post("/api/auth/register", json={
        "email": "valid_org@example.com",
        "password": "password123",
        "full_name": "Valid Org",
        "role": "organizer"
    })
    login_res = client.post("/api/auth/login", json={
        "email": "valid_org@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test invalid capacity < 1
    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    res = client.post("/api/events/", headers=headers, json={
        "title": "Invalid Capacity Event",
        "description": "Description",
        "location": "Online",
        "date": future_date,
        "capacity": 0
    })
    assert res.status_code == 422 # Unprocessable Entity

    # Test invalid past date
    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    res = client.post("/api/events/", headers=headers, json={
        "title": "Past Date Event",
        "description": "Description",
        "location": "Online",
        "date": past_date,
        "capacity": 10
    })
    assert res.status_code == 422

def test_event_permissions_and_crud():
    # 1. Register Organizer
    client.post("/api/auth/register", json={
        "email": "org1@example.com",
        "password": "password123",
        "full_name": "Org One",
        "role": "organizer"
    })
    org1_token = client.post("/api/auth/login", json={"email": "org1@example.com", "password": "password123"}).json()["access_token"]
    headers_org1 = {"Authorization": f"Bearer {org1_token}"}

    # 2. Register Regular User
    client.post("/api/auth/register", json={
        "email": "user1@example.com",
        "password": "password123",
        "full_name": "User One",
        "role": "user"
    })
    user1_token = client.post("/api/auth/login", json={"email": "user1@example.com", "password": "password123"}).json()["access_token"]
    headers_user1 = {"Authorization": f"Bearer {user1_token}"}

    # Create Event as Org1
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    res = client.post("/api/events/", headers=headers_org1, json={
        "title": "Cloud Computing Masterclass",
        "description": "Learn Kubernetes, Docker, and Microservices.",
        "location": "Tech Hub Lab",
        "date": future_date,
        "capacity": 2
    })
    assert res.status_code == 201
    event_id = res.json()["id"]

    # 3. Test Unauthenticated GET by ID
    res = client.get(f"/api/events/{event_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "Cloud Computing Masterclass"

    # 4. Test GET Nonexistent Event
    res = client.get("/api/events/9999")
    assert res.status_code == 404

    # 5. Test Unauthenticated Update -> 401
    res = client.put(f"/api/events/{event_id}", json={"title": "Hacked Title"})
    assert res.status_code == 401

    # 6. Test Non-Organizer User Update -> 403
    res = client.put(f"/api/events/{event_id}", headers=headers_user1, json={"title": "Hacked Title"})
    assert res.status_code == 403

    # 7. Test User1 Registration
    res = client.post(f"/api/events/{event_id}/register", headers=headers_user1)
    assert res.status_code == 201

    # 8. Test GET my-registrations as User1
    res = client.get("/api/events/my-registrations", headers=headers_user1)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == event_id

    # 9. Test Capacity reduction below registrations (1 registration present, try capacity=0 or 0 via validate)
    res = client.put(f"/api/events/{event_id}", headers=headers_org1, json={"capacity": 0})
    assert res.status_code == 422

    # 10. Successful Update by Org1
    res = client.put(f"/api/events/{event_id}", headers=headers_org1, json={"title": "Advanced Cloud Computing Summit"})
    assert res.status_code == 200
    assert res.json()["title"] == "Advanced Cloud Computing Summit"

    # 11. Search Event Verification
    res = client.post("/api/events/search", json={"query": "Kubernetes and Docker microservices"})
    assert res.status_code == 200
    assert len(res.json()) > 0
    assert res.json()[0]["id"] == event_id

    # 12. Delete Event by Non-Organizer -> 403
    res = client.delete(f"/api/events/{event_id}", headers=headers_user1)
    assert res.status_code == 403

    # 13. Delete Event by Organizer -> 200
    res = client.delete(f"/api/events/{event_id}", headers=headers_org1)
    assert res.status_code == 200

    # 14. Verify Event is deleted & removed from search
    res = client.get(f"/api/events/{event_id}")
    assert res.status_code == 404

    res = client.get("/api/events/my-registrations", headers=headers_user1)
    assert res.status_code == 200
    assert len(res.json()) == 0
