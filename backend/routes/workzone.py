from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional

from models.schemas import (
    User, UserRole, WorkZoneSettingsUpdate, WorkZoneSettingsResponse, GmailAccountUpdate
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
    
    # Update the user's gmail_account field
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "gmail_account": email,
            "gmail_submitted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Your Gmail has been saved. Work Zone access will be provisioned shortly.",
        "gmail_account": email
    }

@router.get("/my-gmail")
async def get_my_gmail(current_user: User = Depends(get_current_user)):
    """Get current user's stored Gmail account"""
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "gmail_account": 1})
    return {"gmail_account": user.get("gmail_account") if user else None}
