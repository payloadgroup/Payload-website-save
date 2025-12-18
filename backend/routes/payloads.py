from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User, UserRole, PayloadStatus,
    PayloadCreate, PayloadUpdate, PayloadResponse
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/payloads", tags=["payloads"])

@router.get("", response_model=List[PayloadResponse])
async def get_payloads(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        payloads = await db.payloads.find({}, {"_id": 0}).to_list(1000)
    else:
        payloads = await db.payloads.find({"assigned_to": current_user.id}, {"_id": 0}).to_list(1000)
    return [PayloadResponse(**p) for p in payloads]

@router.post("", response_model=PayloadResponse)
async def create_payload(payload_data: PayloadCreate, admin_user: User = Depends(get_admin_user)):
    payload = {
        "id": str(uuid.uuid4()),
        "assigned_to": payload_data.assigned_to,
        "created_by": admin_user.id,
        "title": payload_data.title,
        "description": payload_data.description,
        "status": PayloadStatus.ACTIVE,
        "funding_goal": payload_data.funding_goal,
        "current_funding": payload_data.current_funding,
        "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payloads.insert_one(payload)
    return PayloadResponse(**payload)

@router.put("/{payload_id}", response_model=PayloadResponse)
async def update_payload(payload_id: str, payload_data: PayloadUpdate, admin_user: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in payload_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.payloads.update_one({"id": payload_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payload not found")
    payload = await db.payloads.find_one({"id": payload_id}, {"_id": 0})
    return PayloadResponse(**payload)

@router.post("/{payload_id}/toggle-active")
async def toggle_payload_active(payload_id: str, current_user: User = Depends(get_current_user)):
    payload = await db.payloads.find_one({"id": payload_id, "assigned_to": current_user.id}, {"_id": 0})
    if not payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    new_active_state = not payload.get("is_active", False)
    await db.payloads.update_one({"id": payload_id}, {"$set": {"is_active": new_active_state}})
    return {"message": "Payload activation toggled", "is_active": new_active_state}

@router.delete("/{payload_id}")
async def delete_payload(payload_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.payloads.delete_one({"id": payload_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payload not found")
    return {"message": "Payload deleted"}
