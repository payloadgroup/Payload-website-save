from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List

from models.schemas import (
    User, UserRole, WorkZoneSettingsUpdate, WorkZoneSettingsResponse, 
    GmailAccountUpdate, WorkZoneAccessStatus, WorkZoneAccessRequest
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/workzone", tags=["workzone"])

# ============ ADMIN WORK ZONE SETTINGS ============

@router.get("/settings", response_model=WorkZoneSettingsResponse)
async def get_workzone_settings(admin_user: User = Depends(get_admin_user)):
    """Get admin's Work Zone settings (Google account for Drive)"""
    settings = await db.workzone_settings.find_one({"type": "admin_settings"}, {"_id": 0})
    if not settings:
        return WorkZoneSettingsResponse(admin_google_email=None, updated_at=None)
    return WorkZoneSettingsResponse(**settings)

@router.post("/settings", response_model=WorkZoneSettingsResponse)
async def update_workzone_settings(
    settings: WorkZoneSettingsUpdate, 
    admin_user: User = Depends(get_admin_user)
):
    """Update admin's Work Zone Google account setting"""
    update_data = {
        "type": "admin_settings",
        "admin_google_email": settings.admin_google_email,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin_user.id
    }
    
    await db.workzone_settings.update_one(
        {"type": "admin_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return WorkZoneSettingsResponse(
        admin_google_email=settings.admin_google_email,
        updated_at=update_data["updated_at"]
    )

# ============ MEMBER GMAIL ACCOUNT ============

@router.post("/request-access")
async def request_workzone_access(
    gmail_data: GmailAccountUpdate,
    current_user: User = Depends(get_current_user)
):
    """Member submits their Gmail account to request Work Zone access"""
    # Validate it looks like a Gmail address
    email = gmail_data.gmail_account.lower().strip()
    if not email.endswith('@gmail.com'):
        raise HTTPException(status_code=400, detail="Please provide a valid Gmail address ending with @gmail.com")
    
    # Update the user's gmail_account field and set status to pending
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "gmail_account": email,
            "gmail_submitted_at": datetime.now(timezone.utc).isoformat(),
            "workzone_access_status": WorkZoneAccessStatus.PENDING
        }}
    )
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Your Gmail has been saved. Work Zone access is pending approval by Director.",
        "gmail_account": email,
        "workzone_access_status": WorkZoneAccessStatus.PENDING
    }

@router.get("/my-status")
async def get_my_workzone_status(current_user: User = Depends(get_current_user)):
    """Get current user's Work Zone access status"""
    user = await db.users.find_one(
        {"id": current_user.id}, 
        {"_id": 0, "gmail_account": 1, "workzone_access_status": 1}
    )
    return {
        "gmail_account": user.get("gmail_account") if user else None,
        "workzone_access_status": user.get("workzone_access_status", WorkZoneAccessStatus.NONE) if user else WorkZoneAccessStatus.NONE
    }

@router.get("/my-gmail")
async def get_my_gmail(current_user: User = Depends(get_current_user)):
    """Get current user's stored Gmail account"""
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "gmail_account": 1})
    return {"gmail_account": user.get("gmail_account") if user else None}

# ============ ADMIN ACCESS MANAGEMENT ============

@router.get("/pending-requests", response_model=List[WorkZoneAccessRequest])
async def get_pending_requests(admin_user: User = Depends(get_admin_user)):
    """Get all pending Work Zone access requests"""
    pending_users = await db.users.find(
        {
            "workzone_access_status": WorkZoneAccessStatus.PENDING,
            "gmail_account": {"$ne": None}
        },
        {"_id": 0}
    ).to_list(1000)
    
    requests = []
    for user in pending_users:
        requests.append(WorkZoneAccessRequest(
            user_id=user["id"],
            user_name=user.get("name", "Unknown"),
            user_email=user.get("email", ""),
            gmail_account=user.get("gmail_account", ""),
            requested_at=user.get("gmail_submitted_at", ""),
            status=WorkZoneAccessStatus.PENDING
        ))
    
    return requests

@router.get("/approved-members", response_model=List[WorkZoneAccessRequest])
async def get_approved_members(admin_user: User = Depends(get_admin_user)):
    """Get all members with approved Work Zone access"""
    approved_users = await db.users.find(
        {
            "workzone_access_status": WorkZoneAccessStatus.APPROVED,
            "gmail_account": {"$ne": None}
        },
        {"_id": 0}
    ).to_list(1000)
    
    members = []
    for user in approved_users:
        members.append(WorkZoneAccessRequest(
            user_id=user["id"],
            user_name=user.get("name", "Unknown"),
            user_email=user.get("email", ""),
            gmail_account=user.get("gmail_account", ""),
            requested_at=user.get("workzone_approved_at", user.get("gmail_submitted_at", "")),
            status=WorkZoneAccessStatus.APPROVED
        ))
    
    return members

@router.post("/approve-access/{user_id}")
async def approve_workzone_access(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Approve a member's Work Zone access request"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("gmail_account"):
        raise HTTPException(status_code=400, detail="User has not submitted a Gmail account")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "workzone_access_status": WorkZoneAccessStatus.APPROVED,
            "workzone_approved_at": datetime.now(timezone.utc).isoformat(),
            "workzone_approved_by": admin_user.id
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to approve access")
    
    return {"message": f"Work Zone access approved for {user.get('name', 'user')}"}

@router.post("/remove-request/{user_id}")
async def remove_workzone_request(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Remove a member's Work Zone access request"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "workzone_access_status": WorkZoneAccessStatus.NONE
        },
        "$unset": {
            "gmail_account": "",
            "gmail_submitted_at": "",
            "workzone_approved_at": "",
            "workzone_approved_by": ""
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to remove request")
    
    return {"message": "Work Zone access request removed"}
