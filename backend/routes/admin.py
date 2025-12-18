from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone, timedelta

from models.schemas import (
    User, UserRole, UserStatus, UserApprovalRequest,
    UpdateTierRequest, MemberTier,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    PayloadStatus, MissionStatus
)
from utils.dependencies import get_admin_user
from utils.database import db

router = APIRouter(prefix="/admin", tags=["admin"])

# ============ USER MANAGEMENT ============

@router.get("/pending-users", response_model=List[User])
async def get_pending_users(admin_user: User = Depends(get_admin_user)):
    pending_users = await db.users.find(
        {"status": UserStatus.PENDING},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in pending_users]

@router.get("/members", response_model=List[User])
async def get_all_members(admin_user: User = Depends(get_admin_user)):
    members = await db.users.find(
        {"role": UserRole.MEMBER, "status": UserStatus.APPROVED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in members]

@router.get("/locked-users", response_model=List[User])
async def get_locked_users(admin_user: User = Depends(get_admin_user)):
    locked_users = await db.users.find(
        {"status": UserStatus.LOCKED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in locked_users]

@router.post("/lock-user/{user_id}")
async def lock_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot lock admin accounts")
    await db.users.update_one({"id": user_id}, {"$set": {"status": UserStatus.LOCKED}})
    return {"message": "User account locked successfully"}

@router.post("/unlock-user/{user_id}")
async def unlock_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"id": user_id}, {"$set": {"status": UserStatus.APPROVED}})
    return {"message": "User account unlocked successfully"}

@router.delete("/delete-user/{user_id}")
async def delete_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete admin accounts")
    await db.payloads.delete_many({"assigned_to": user_id})
    await db.missions.delete_many({"assigned_to": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.headquarters.delete_many({"user_id": user_id})
    await db.stations.delete_many({"user_id": user_id})
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete user")
    return {"message": "User account and related data deleted successfully"}

@router.post("/update-user-status")
async def update_user_status(request: UserApprovalRequest, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"id": request.user_id}, {"$set": {"status": request.status}})
    if request.status == UserStatus.APPROVED and user.get("referred_by"):
        await db.users.update_one({"id": user["referred_by"]}, {"$inc": {"referral_count": 1}})
    return {"message": f"User status updated to {request.status}"}

# ============ TIER MANAGEMENT ============

@router.post("/update-tier")
async def update_member_tier(request: UpdateTierRequest, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot change admin tier")
    await db.users.update_one({"id": request.user_id}, {"$set": {"tier": request.tier}})
    return {"message": f"User tier updated to {request.tier}"}

@router.get("/members-by-tier/{tier}", response_model=List[User])
async def get_members_by_tier(tier: MemberTier, admin_user: User = Depends(get_admin_user)):
    members = await db.users.find(
        {"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "tier": tier},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in members]

# ============ ANNOUNCEMENTS ============

@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, admin_user: User = Depends(get_admin_user)):
    import uuid
    announcement_id = str(uuid.uuid4())
    new_announcement = {
        "id": announcement_id,
        "title": announcement.title,
        "content": announcement.content,
        "priority": announcement.priority,
        "is_pinned": announcement.is_pinned,
        "is_active": True,
        "target_tiers": announcement.target_tiers,
        "created_by": admin_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "scheduled_for": announcement.scheduled_for,
        "read_by": []
    }
    await db.announcements.insert_one(new_announcement)
    return AnnouncementResponse(**new_announcement)

@router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_all_announcements(admin_user: User = Depends(get_admin_user)):
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [AnnouncementResponse(**a) for a in announcements]

@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(announcement_id: str, update: AnnouncementUpdate, admin_user: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.announcements.update_one({"id": announcement_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    updated = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    return AnnouncementResponse(**updated)

@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}

# ============ ACTIVITY MONITORING ============

@router.get("/activity-stats")
async def get_activity_stats(admin_user: User = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    total_members = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED})
    active_7 = await db.users.count_documents({
        "role": UserRole.MEMBER, "status": UserStatus.APPROVED, "last_login": {"$gte": seven_days_ago}
    })
    active_30 = await db.users.count_documents({
        "role": UserRole.MEMBER, "status": UserStatus.APPROVED, "last_login": {"$gte": thirty_days_ago}
    })
    inactive = total_members - active_30
    
    tier_distribution = {}
    for tier in MemberTier:
        count = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "tier": tier})
        tier_distribution[tier.value] = count
    
    recent_logins = await db.users.find(
        {"role": UserRole.MEMBER, "last_login": {"$ne": None}},
        {"_id": 0, "password": 0}
    ).sort("last_login", -1).to_list(20)
    
    return {
        "total_members": total_members,
        "active_last_7_days": active_7,
        "active_last_30_days": active_30,
        "inactive_members": inactive,
        "tier_distribution": tier_distribution,
        "recent_logins": [{"id": u["id"], "name": u["name"], "email": u["email"], "last_login": u.get("last_login"), "login_count": u.get("login_count", 0)} for u in recent_logins]
    }

@router.get("/inactive-members", response_model=List[User])
async def get_inactive_members(days: int = 30, admin_user: User = Depends(get_admin_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    inactive = await db.users.find(
        {
            "role": UserRole.MEMBER,
            "status": UserStatus.APPROVED,
            "$or": [{"last_login": {"$lt": cutoff}}, {"last_login": None}]
        },
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**u) for u in inactive]

# ============ REFERRAL MANAGEMENT ============

@router.get("/referral-stats")
async def get_referral_stats(admin_user: User = Depends(get_admin_user)):
    total_referrals = await db.users.count_documents({"referred_by": {"$ne": None}})
    successful_referrals = await db.users.count_documents({"referred_by": {"$ne": None}, "status": UserStatus.APPROVED})
    pending_referrals = await db.users.count_documents({"referred_by": {"$ne": None}, "status": UserStatus.PENDING})
    top_referrers = await db.users.find({"referral_count": {"$gt": 0}}, {"_id": 0, "password": 0}).sort("referral_count", -1).to_list(10)
    return {
        "total_referrals": total_referrals,
        "successful_referrals": successful_referrals,
        "pending_referrals": pending_referrals,
        "top_referrers": [{"id": u["id"], "name": u["name"], "referral_count": u.get("referral_count", 0), "own_referral_code": u.get("own_referral_code")} for u in top_referrers]
    }

@router.get("/referrals-by-user/{user_id}")
async def get_user_referrals(user_id: str, admin_user: User = Depends(get_admin_user)):
    referrals = await db.users.find({"referred_by": user_id}, {"_id": 0, "password": 0}).to_list(100)
    return [User(**u) for u in referrals]

# ============ ANALYTICS ============

@router.get("/analytics")
async def get_analytics(admin_user: User = Depends(get_admin_user)):
    total_members = await db.users.count_documents({"role": UserRole.MEMBER})
    approved_members = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED})
    pending_members = await db.users.count_documents({"status": UserStatus.PENDING})
    total_payloads = await db.payloads.count_documents({})
    active_payloads = await db.payloads.count_documents({"status": PayloadStatus.ACTIVE})
    total_missions = await db.missions.count_documents({})
    completed_missions = await db.missions.count_documents({"status": MissionStatus.COMPLETED})
    total_transactions = await db.transactions.count_documents({})
    recent_members = await db.users.find({"role": UserRole.MEMBER}, {"_id": 0, "password": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "total_members": total_members,
        "approved_members": approved_members,
        "pending_members": pending_members,
        "total_payloads": total_payloads,
        "active_payloads": active_payloads,
        "total_missions": total_missions,
        "completed_missions": completed_missions,
        "total_transactions": total_transactions,
        "recent_members": recent_members
    }
