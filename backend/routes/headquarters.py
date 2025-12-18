from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User,
    HeadquartersCreate, HeadquartersUpdate, HeadquartersResponse
)
from utils.dependencies import get_current_user
from utils.database import db

router = APIRouter(prefix="/headquarters", tags=["headquarters"])

@router.get("", response_model=Optional[HeadquartersResponse])
async def get_headquarters(current_user: User = Depends(get_current_user)):
    hq = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    return HeadquartersResponse(**hq) if hq else None

@router.post("", response_model=HeadquartersResponse)
async def create_headquarters(hq_data: HeadquartersCreate, current_user: User = Depends(get_current_user)):
    existing = await db.headquarters.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Headquarters already exists")
    hq = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "name": hq_data.name,
        "location": hq_data.location,
        "description": hq_data.description,
        "established_date": datetime.now(timezone.utc).isoformat()
    }
    await db.headquarters.insert_one(hq)
    return HeadquartersResponse(**hq)

@router.put("", response_model=HeadquartersResponse)
async def update_headquarters(hq_data: HeadquartersUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in hq_data.model_dump().items() if v is not None}
    result = await db.headquarters.update_one({"user_id": current_user.id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Headquarters not found")
    hq = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    return HeadquartersResponse(**hq)
