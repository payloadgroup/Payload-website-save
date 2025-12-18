from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User, UserRole, MissionStatus,
    MissionCreate, MissionUpdate, MissionResponse
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/missions", tags=["missions"])

@router.get("", response_model=List[MissionResponse])
async def get_missions(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        missions = await db.missions.find({}, {"_id": 0}).to_list(1000)
    else:
        missions = await db.missions.find({"assigned_to": current_user.id}, {"_id": 0}).to_list(1000)
    return [MissionResponse(**m) for m in missions]

@router.post("", response_model=MissionResponse)
async def create_mission(mission_data: MissionCreate, admin_user: User = Depends(get_admin_user)):
    mission = {
        "id": str(uuid.uuid4()),
        "assigned_to": mission_data.assigned_to,
        "created_by": admin_user.id,
        "payload_id": mission_data.payload_id,
        "title": mission_data.title,
        "objective": mission_data.objective,
        "status": MissionStatus.PENDING,
        "due_date": mission_data.due_date,
        "priority": mission_data.priority,
        "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.missions.insert_one(mission)
    return MissionResponse(**mission)

@router.put("/{mission_id}", response_model=MissionResponse)
async def update_mission(mission_id: str, mission_data: MissionUpdate, admin_user: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in mission_data.model_dump().items() if v is not None}
    result = await db.missions.update_one({"id": mission_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    return MissionResponse(**mission)

@router.post("/{mission_id}/toggle-active")
async def toggle_mission_active(mission_id: str, current_user: User = Depends(get_current_user)):
    mission = await db.missions.find_one({"id": mission_id, "assigned_to": current_user.id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    new_active_state = not mission.get("is_active", False)
    await db.missions.update_one({"id": mission_id}, {"$set": {"is_active": new_active_state}})
    return {"message": "Mission activation toggled", "is_active": new_active_state}

@router.delete("/{mission_id}")
async def delete_mission(mission_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.missions.delete_one({"id": mission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"message": "Mission deleted"}
