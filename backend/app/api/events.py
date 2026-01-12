import json
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models import models, schemas
from app.api.deps import get_db, get_current_user, get_current_organizer
from app.services.search import index_event, search_events, remove_event_embedding

router = APIRouter()

# WebSocket connections: mapping event_id -> list of active WebSockets
connections: Dict[int, List[WebSocket]] = {}

def _cleanup_connection(event_id: int, websocket: WebSocket):
    """Safely remove a WebSocket connection from the event connection mapping."""
    if event_id in connections:
        if websocket in connections[event_id]:
            try:
                connections[event_id].remove(websocket)
            except ValueError:
                pass
        if not connections[event_id]:
            del connections[event_id]

async def broadcast_registration_count(event_id: int, count: int):
    """Broadcast current registration count to all connected WebSockets for an event."""
    if event_id in connections:
        message = json.dumps({"event_id": event_id, "count": count})
        # Iterate over copy of connection list for thread safety
        for websocket in list(connections[event_id]):
            try:
                await websocket.send_text(message)
            except Exception:
                _cleanup_connection(event_id, websocket)

@router.websocket("/ws/events/{event_id}/registrations")
async def websocket_endpoint(websocket: WebSocket, event_id: int):
    await websocket.accept()
    if event_id not in connections:
        connections[event_id] = []
    connections[event_id].append(websocket)
    try:
        while True:
            # Maintain active connection stream
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        _cleanup_connection(event_id, websocket)

@router.post("/", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: schemas.EventCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_organizer)
):
    new_event = models.Event(
        title=event_in.title,
        description=event_in.description,
        location=event_in.location,
        date=event_in.date,
        capacity=event_in.capacity,
        organizer_id=current_user.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Generate embedding & add to search index AFTER successful DB commit
    try:
        index_event(new_event.id, new_event.title, new_event.description)
    except Exception as e:
        print(f"Warning: Failed to index event {new_event.id}: {e}")
        
    return schemas.EventResponse(
        id=new_event.id,
        title=new_event.title,
        description=new_event.description,
        location=new_event.location,
        date=new_event.date,
        capacity=new_event.capacity,
        organizer_id=new_event.organizer_id,
        created_at=new_event.created_at,
        registered_count=0,
        is_registered=False
    )

@router.get("/", response_model=List[schemas.EventResponse])
def get_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(models.Event).offset(skip).limit(limit).all()
    if not events:
        return []
        
    event_ids = [e.id for e in events]
    # Efficient count aggregation in single query
    counts_query = (
        db.query(models.Registration.event_id, func.count(models.Registration.id))
        .filter(models.Registration.event_id.in_(event_ids))
        .group_by(models.Registration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_query}
    
    results = []
    for evt in events:
        count = counts_map.get(evt.id, 0)
        results.append(schemas.EventResponse(
            id=evt.id,
            title=evt.title,
            description=evt.description,
            location=evt.location,
            date=evt.date,
            capacity=evt.capacity,
            organizer_id=evt.organizer_id,
            created_at=evt.created_at,
            registered_count=count,
            is_registered=False
        ))
    return results

@router.get("/my-registrations", response_model=List[schemas.EventResponse])
def get_my_registrations(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    registrations = (
        db.query(models.Registration)
        .options(joinedload(models.Registration.event))
        .filter(models.Registration.user_id == current_user.id)
        .all()
    )
    if not registrations:
        return []
        
    events = [reg.event for reg in registrations if reg.event is not None]
    if not events:
        return []
        
    event_ids = [e.id for e in events]
    counts_query = (
        db.query(models.Registration.event_id, func.count(models.Registration.id))
        .filter(models.Registration.event_id.in_(event_ids))
        .group_by(models.Registration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_query}
    
    results = []
    for evt in events:
        count = counts_map.get(evt.id, 0)
        results.append(schemas.EventResponse(
            id=evt.id,
            title=evt.title,
            description=evt.description,
            location=evt.location,
            date=evt.date,
            capacity=evt.capacity,
            organizer_id=evt.organizer_id,
            created_at=evt.created_at,
            registered_count=count,
            is_registered=True
        ))
    return results

@router.get("/my-events", response_model=List[schemas.EventResponse])
def get_my_events(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_organizer)
):
    events = db.query(models.Event).filter(models.Event.organizer_id == current_user.id).all()
    if not events:
        return []
        
    event_ids = [e.id for e in events]
    counts_query = (
        db.query(models.Registration.event_id, func.count(models.Registration.id))
        .filter(models.Registration.event_id.in_(event_ids))
        .group_by(models.Registration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_query}
    
    results = []
    for evt in events:
        count = counts_map.get(evt.id, 0)
        results.append(schemas.EventResponse(
            id=evt.id,
            title=evt.title,
            description=evt.description,
            location=evt.location,
            date=evt.date,
            capacity=evt.capacity,
            organizer_id=evt.organizer_id,
            created_at=evt.created_at,
            registered_count=count,
            is_registered=False
        ))
    return results

@router.post("/search", response_model=List[schemas.EventResponse])
def search_events_endpoint(query: schemas.SearchQuery, db: Session = Depends(get_db)):
    event_ids = search_events(query.query, query.top_k)
    if not event_ids:
        return []
        
    events_from_db = db.query(models.Event).filter(models.Event.id.in_(event_ids)).all()
    event_map = {evt.id: evt for evt in events_from_db}
    
    counts_query = (
        db.query(models.Registration.event_id, func.count(models.Registration.id))
        .filter(models.Registration.event_id.in_(event_ids))
        .group_by(models.Registration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_query}
    
    results = []
    for eid in event_ids:
        if eid in event_map:
            evt = event_map[eid]
            count = counts_map.get(evt.id, 0)
            results.append(schemas.EventResponse(
                id=evt.id,
                title=evt.title,
                description=evt.description,
                location=evt.location,
                date=evt.date,
                capacity=evt.capacity,
                organizer_id=evt.organizer_id,
                created_at=evt.created_at,
                registered_count=count,
                is_registered=False
            ))
    return results

@router.get("/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    count = db.query(func.count(models.Registration.id)).filter(models.Registration.event_id == event_id).scalar() or 0
    return schemas.EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        location=event.location,
        date=event.date,
        capacity=event.capacity,
        organizer_id=event.organizer_id,
        created_at=event.created_at,
        registered_count=count,
        is_registered=False
    )

@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    event_in: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_organizer)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to update this event"
        )
        
    current_reg_count = (
        db.query(func.count(models.Registration.id))
        .filter(models.Registration.event_id == event_id)
        .scalar() or 0
    )
    
    update_data = event_in.model_dump(exclude_unset=True)
    if "capacity" in update_data and update_data["capacity"] is not None:
        new_capacity = update_data["capacity"]
        if new_capacity < current_reg_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce capacity to {new_capacity} as there are already {current_reg_count} registrations."
            )
            
    for field, value in update_data.items():
        if value is not None:
            setattr(event, field, value)
            
    db.commit()
    db.refresh(event)
    
    # Update embedding in search index AFTER successful DB commit
    try:
        index_event(event.id, event.title, event.description)
    except Exception as e:
        print(f"Warning: Failed to update search index for event {event.id}: {e}")
        
    return schemas.EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        location=event.location,
        date=event.date,
        capacity=event.capacity,
        organizer_id=event.organizer_id,
        created_at=event.created_at,
        registered_count=current_reg_count,
        is_registered=False
    )

@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_organizer)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to delete this event"
        )
        
    # Transactional DB deletion: remove registrations first, then the event
    db.query(models.Registration).filter(models.Registration.event_id == event_id).delete()
    db.delete(event)
    db.commit()
    
    # Remove embedding from search index AFTER DB commit succeeds
    try:
        remove_event_embedding(event_id)
    except Exception as e:
        print(f"Warning: Failed to remove search embedding for deleted event {event_id}: {e}")
        
    return {"message": "Event deleted successfully"}

@router.post("/{event_id}/register", status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    existing_reg = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="You are already registered for this event"
        )
        
    current_count = (
        db.query(func.count(models.Registration.id))
        .filter(models.Registration.event_id == event_id)
        .scalar() or 0
    )
    if current_count >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Event is at full capacity"
        )
        
    new_reg = models.Registration(user_id=current_user.id, event_id=event_id)
    db.add(new_reg)
    db.commit()
    
    new_count = current_count + 1
    await broadcast_registration_count(event_id, new_count)
    return {"message": "Successfully registered for event"}

@router.delete("/{event_id}/register", status_code=status.HTTP_200_OK)
async def unregister_from_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reg = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Registration not found"
        )
        
    db.delete(reg)
    db.commit()
    
    current_count = (
        db.query(func.count(models.Registration.id))
        .filter(models.Registration.event_id == event_id)
        .scalar() or 0
    )
    await broadcast_registration_count(event_id, current_count)
    return {"message": "Registration cancelled successfully"}
