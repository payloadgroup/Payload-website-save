from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from datetime import datetime, timezone, timedelta
import uuid
import asyncio
import base64

from models.schemas import (
    User, UserRole, UserStatus, UserApprovalRequest,
    UpdateTierRequest, MemberTier, CreateMemberRequest,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    PayloadStatus, MissionStatus
)
from utils.dependencies import get_admin_user
from utils.database import db
from utils.auth import hash_password, generate_referral_code
from utils.email import send_approval_email_workflow

router = APIRouter(prefix="/admin", tags=["admin"])

# ============ USER MANAGEMENT ============

@router.get("/pending-users", response_model=List[User])
async def get_pending_users(admin_user: User = Depends(get_admin_user)):
    pending_users = await db.users.find({"status": UserStatus.PENDING}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in pending_users]

@router.get("/members", response_model=List[User])
async def get_all_members(admin_user: User = Depends(get_admin_user)):
    members = await db.users.find({"role": UserRole.MEMBER, "status": UserStatus.APPROVED}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in members]

@router.get("/locked-users", response_model=List[User])
async def get_locked_users(admin_user: User = Depends(get_admin_user)):
    locked_users = await db.users.find({"status": UserStatus.LOCKED}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in locked_users]

@router.get("/denied-users", response_model=List[User])
async def get_denied_users(admin_user: User = Depends(get_admin_user)):
    denied_users = await db.users.find({"status": UserStatus.DENIED}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in denied_users]

@router.get("/deleted-users", response_model=List[User])
async def get_deleted_users(admin_user: User = Depends(get_admin_user)):
    deleted_users = await db.users.find({"status": UserStatus.DELETED}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in deleted_users]

@router.post("/create-member", response_model=User)
async def create_member(member_data: CreateMemberRequest, admin_user: User = Depends(get_admin_user)):
    existing = await db.users.find_one({"email": member_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    own_referral_code = generate_referral_code(member_data.name)
    
    new_user = {
        "id": user_id,
        "name": member_data.name,
        "email": member_data.email,
        "password": hash_password(member_data.password),
        "mobile": member_data.mobile,
        "date_of_birth": member_data.date_of_birth,
        "role": UserRole.MEMBER,
        "status": UserStatus.APPROVED,
        "tier": member_data.tier,
        "referral_code": None,
        "own_referral_code": own_referral_code,
        "referred_by": None,
        "referral_count": 0,
        "last_login": None,
        "login_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "onboarding_complete": False
    }
    await db.users.insert_one(new_user)
    new_user.pop("password")
    return User(**new_user)

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
    # Soft delete - change status to DELETED instead of removing
    from datetime import datetime, timezone
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {"status": UserStatus.DELETED, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "User account marked as deleted"}

@router.delete("/permanent-delete-user/{user_id}")
async def permanent_delete_user(user_id: str, admin_user: User = Depends(get_admin_user)):
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
    return {"message": "User account and related data permanently deleted"}

@router.post("/restore-user/{user_id}")
async def restore_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("status") not in [UserStatus.DELETED, UserStatus.DENIED]:
        raise HTTPException(status_code=400, detail="User is not deleted or denied")
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {"status": UserStatus.PENDING}, "$unset": {"deleted_at": ""}}
    )
    return {"message": "User restored to pending status"}

def get_tier_for_referral_count(count: int) -> MemberTier:
    """Calculate the appropriate tier based on referral count"""
    if count >= 10:
        return MemberTier.TOP_LEADERSHIP
    elif count >= 5:
        return MemberTier.SENIOR_MANAGER
    elif count >= 3:
        return MemberTier.MID_LEVEL_MANAGER
    elif count >= 1:
        return MemberTier.FRONT_LINE
    return MemberTier.JUNIOR_RECRUIT

@router.post("/update-user-status")
async def update_user_status(request: UserApprovalRequest, background_tasks: BackgroundTasks, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    previous_status = user.get("status")
    await db.users.update_one({"id": request.user_id}, {"$set": {"status": request.status}})
    
    # Handle referral count update and automatic tier upgrade
    if request.status == UserStatus.APPROVED and user.get("referred_by"):
        referrer_id = user["referred_by"]
        # Increment the referral count
        await db.users.update_one({"id": referrer_id}, {"$inc": {"referral_count": 1}})
        
        # Get updated referrer data to calculate new tier
        referrer = await db.users.find_one({"id": referrer_id}, {"_id": 0})
        if referrer:
            new_referral_count = referrer.get("referral_count", 0)
            new_tier = get_tier_for_referral_count(new_referral_count)
            current_tier = referrer.get("tier", MemberTier.JUNIOR_RECRUIT)
            
            # Only upgrade tier if the new tier is higher (compare by referral thresholds)
            tier_order = [MemberTier.JUNIOR_RECRUIT, MemberTier.FRONT_LINE, MemberTier.MID_LEVEL_MANAGER, MemberTier.SENIOR_MANAGER, MemberTier.TOP_LEADERSHIP]
            if tier_order.index(new_tier) > tier_order.index(current_tier if current_tier in tier_order else MemberTier.JUNIOR_RECRUIT):
                await db.users.update_one({"id": referrer_id}, {"$set": {"tier": new_tier}})
    
    # Send approval emails when status changes to APPROVED
    if request.status == UserStatus.APPROVED and previous_status != UserStatus.APPROVED:
        # Get the temporary password if available
        temp_password = user.get("temp_password")
        if temp_password:
            try:
                original_password = base64.b64decode(temp_password).decode()
            except Exception:
                original_password = "[Password not available - please use forgot password]"
            
            # Clear the temp password from database
            await db.users.update_one(
                {"id": request.user_id}, 
                {"$unset": {"temp_password": ""}}
            )
        else:
            original_password = "[Password not available - please use forgot password]"
        
        # Get user tier
        user_tier = user.get("tier", MemberTier.JUNIOR_RECRUIT)
        if hasattr(user_tier, 'value'):
            user_tier = user_tier.value
        
        # Schedule the approval email workflow in background
        background_tasks.add_task(
            send_approval_email_workflow,
            user["email"],
            user["name"],
            original_password,
            user_tier
        )
        
        # Auto-activate Censored Referrals project for the newly approved member
        from routes.projects import ensure_censored_referrals_active
        await ensure_censored_referrals_active(request.user_id)
    
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
    members = await db.users.find({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "tier": tier}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**user) for user in members]

# ============ ANNOUNCEMENTS ============

@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, admin_user: User = Depends(get_admin_user)):
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
    active_7 = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "last_login": {"$gte": seven_days_ago}})
    active_30 = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "last_login": {"$gte": thirty_days_ago}})
    inactive = total_members - active_30
    
    tier_distribution = {}
    for tier in MemberTier:
        count = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "tier": tier})
        tier_distribution[tier.value] = count
    
    recent_logins = await db.users.find({"role": UserRole.MEMBER, "last_login": {"$ne": None}}, {"_id": 0, "password": 0}).sort("last_login", -1).to_list(20)
    
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
    inactive = await db.users.find({"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "$or": [{"last_login": {"$lt": cutoff}}, {"last_login": None}]}, {"_id": 0, "password": 0}).to_list(1000)
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

@router.post("/recalculate-referral-tiers")
async def recalculate_referral_tiers(admin_user: User = Depends(get_admin_user)):
    """
    Recalculates and updates tiers for all members based on their referral count.
    Only upgrades tiers - never downgrades.
    """
    members = await db.users.find(
        {"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "referral_count": {"$gt": 0}},
        {"_id": 0}
    ).to_list(1000)
    
    updated_count = 0
    tier_order = [MemberTier.JUNIOR_RECRUIT, MemberTier.FRONT_LINE, MemberTier.MID_LEVEL_MANAGER, MemberTier.SENIOR_MANAGER, MemberTier.TOP_LEADERSHIP]
    
    for member in members:
        referral_count = member.get("referral_count", 0)
        current_tier = member.get("tier", MemberTier.JUNIOR_RECRUIT)
        new_tier = get_tier_for_referral_count(referral_count)
        
        # Only upgrade, never downgrade
        current_index = tier_order.index(current_tier) if current_tier in tier_order else 0
        new_index = tier_order.index(new_tier)
        
        if new_index > current_index:
            await db.users.update_one({"id": member["id"]}, {"$set": {"tier": new_tier}})
            updated_count += 1
    
    return {
        "message": f"Recalculated tiers for {len(members)} members with referrals",
        "upgraded_count": updated_count
    }

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
