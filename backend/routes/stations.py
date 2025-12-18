from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User, StationStatus,
    StationCreate, StationUpdate, StationResponse
)
from utils.dependencies import get_current_user
from utils.database import db

router = APIRouter(prefix="/stations", tags=["stations"])

@router.get("", response_model=List[StationResponse])
async def get_stations(current_user: User = Depends(get_current_user)):
    stations = await db.stations.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    return [StationResponse(**s) for s in stations]

@router.post("", response_model=StationResponse)
async def create_station(station_data: StationCreate, current_user: User = Depends(get_current_user)):
    station = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "name": station_data.name,
        "location": station_data.location,
        "type": station_data.type,
        "description": station_data.description,
        "status": StationStatus.ACTIVE,
        "established_date": datetime.now(timezone.utc).isoformat()
    }
    await db.stations.insert_one(station)
    return StationResponse(**station)

@router.put("/{station_id}", response_model=StationResponse)
async def update_station(station_id: str, station_data: StationUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in station_data.model_dump().items() if v is not None}
    result = await db.stations.update_one({"id": station_id, "user_id": current_user.id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    station = await db.stations.find_one({"id": station_id}, {"_id": 0})
    return StationResponse(**station)

@router.delete("/{station_id}")
async def delete_station(station_id: str, current_user: User = Depends(get_current_user)):
    result = await db.stations.delete_one({"id": station_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    return {"message": "Station deleted"}
