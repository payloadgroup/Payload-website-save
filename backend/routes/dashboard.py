from fastapi import APIRouter, Depends
from typing import List

from models.schemas import (
    User, UserRole, MemberTier,
    AnnouncementResponse
)
from utils.dependencies import get_current_user
from utils.database import db

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        payloads_count = await db.payloads.count_documents({})
        missions_count = await db.missions.count_documents({})
    else:
        payloads_count = await db.payloads.count_documents({"assigned_to": current_user.id, "is_active": True})
        missions_count = await db.missions.count_documents({"assigned_to": current_user.id, "is_active": True})
    
    transactions = await db.transactions.find({"user_id": current_user.id}).sort("date", -1).limit(1).to_list(1)
    balance = transactions[0]["balance_after"] if transactions else 0.0
    headquarters = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    stations_count = await db.stations.count_documents({"user_id": current_user.id})
    
    return {
        "welcome_message": f"Welcome to Payload, {current_user.name}",
        "member_since": current_user.created_at,
        "status": "Mission Control Online",
        "payloads_count": payloads_count,
        "missions_count": missions_count,
        "balance": balance,
        "headquarters": headquarters,
        "stations_count": stations_count
    }

@router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_member_announcements(current_user: User = Depends(get_current_user)):
    query = {"is_active": True}
    announcements = await db.announcements.find(query, {"_id": 0}).sort([("is_pinned", -1), ("created_at", -1)]).to_list(50)
    user_tier = current_user.tier or MemberTier.CADET
    filtered = []
    for a in announcements:
        if a.get("target_tiers") is None or user_tier in a.get("target_tiers", []):
            filtered.append(AnnouncementResponse(**a))
    return filtered

@router.post("/announcements/{announcement_id}/read")
async def mark_announcement_read(announcement_id: str, current_user: User = Depends(get_current_user)):
    await db.announcements.update_one({"id": announcement_id}, {"$addToSet": {"read_by": current_user.id}})
    return {"message": "Marked as read"}
