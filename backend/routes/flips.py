from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4
import os
import base64

from models.schemas import (
    User, MemberTier, FlipSectionType, FlipTierAccess, 
    OpportunitySubmission, OpportunitySubmitRequest,
    PlayCreate, PlayUpdate, PlayResponse, PlayParticipation,
    PlayParticipantUpdate, ContactStatus
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/flips", tags=["guaranteed-flips"])

# Tier hierarchy for comparison
TIER_LEVELS = {
    MemberTier.JUNIOR_RECRUIT: 1,
    MemberTier.FRONT_LINE: 2,
    MemberTier.MID_LEVEL_MANAGER: 3,
    MemberTier.SENIOR_MANAGER: 4,
    MemberTier.TOP_LEADERSHIP: 5
}

# Default tier access settings
DEFAULT_TIER_ACCESS = {
    FlipSectionType.PROPERTY: MemberTier.JUNIOR_RECRUIT,
    FlipSectionType.BUSINESS: MemberTier.FRONT_LINE,
    FlipSectionType.UNIQUE: MemberTier.MID_LEVEL_MANAGER,
    FlipSectionType.ARBITRAGE: MemberTier.SENIOR_MANAGER,
    FlipSectionType.TOP_SECRET: MemberTier.TOP_LEADERSHIP
}

# Section metadata
SECTION_INFO = {
    FlipSectionType.PROPERTY: {
        "title": "Property Deals / Opportunity",
        "description": "Exclusive real estate opportunities including undervalued properties, development projects, and high-yield rental investments identified by our network."
    },
    FlipSectionType.BUSINESS: {
        "title": "Business Deals / Opportunity",
        "description": "Strategic business acquisitions, partnerships, and investment opportunities in emerging and established ventures with proven growth potential."
    },
    FlipSectionType.UNIQUE: {
        "title": "Uniquely Positioned Deals",
        "description": "Rare opportunities unique to members based on privileged knowledge, exclusive access, or special positioning within specific industries or markets."
    },
    FlipSectionType.ARBITRAGE: {
        "title": "Arbitrage Opportunity",
        "description": "Time-sensitive arbitrage plays across markets, commodities, and assets where price differentials create immediate profit potential."
    },
    FlipSectionType.TOP_SECRET: {
        "title": "Top Secret - 100% Guaranteed ROI",
        "description": "The most exclusive tier. Vetted opportunities with guaranteed returns, available only to our most trusted leadership members."
    }
}

def user_has_access(user_tier: MemberTier, required_tier: MemberTier) -> bool:
    """Check if user's tier meets or exceeds required tier"""
    return TIER_LEVELS.get(user_tier, 0) >= TIER_LEVELS.get(required_tier, 5)

# ============ TIER ACCESS SETTINGS ============

@router.get("/tier-access")
async def get_tier_access_settings(current_user: User = Depends(get_current_user)):
    """Get current tier access settings for all sections"""
    settings = await db.flip_tier_settings.find_one({"type": "tier_access"}, {"_id": 0})
    
    if not settings or "access" not in settings:
        # Return default settings
        return {
            section.value: {
                "required_tier": DEFAULT_TIER_ACCESS[section].value,
                "title": SECTION_INFO[section]["title"],
                "description": SECTION_INFO[section]["description"]
            }
            for section in FlipSectionType
        }
    
    result = {}
    for section in FlipSectionType:
        stored_tier = settings["access"].get(section.value, DEFAULT_TIER_ACCESS[section].value)
        result[section.value] = {
            "required_tier": stored_tier,
            "title": SECTION_INFO[section]["title"],
            "description": SECTION_INFO[section]["description"]
        }
    
    return result

@router.post("/tier-access")
async def update_tier_access_settings(
    access_settings: dict,
    admin_user: User = Depends(get_admin_user)
):
    """Admin updates tier access for sections"""
    # Validate the settings
    for section, tier in access_settings.items():
        if section not in [s.value for s in FlipSectionType]:
            raise HTTPException(status_code=400, detail=f"Invalid section: {section}")
        if tier not in [t.value for t in MemberTier]:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")
    
    await db.flip_tier_settings.update_one(
        {"type": "tier_access"},
        {"$set": {
            "type": "tier_access",
            "access": access_settings,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin_user.id
        }},
        upsert=True
    )
    
    return {"message": "Tier access settings updated successfully"}

# ============ MEMBER ACCESS CHECK ============

@router.get("/my-access")
async def get_my_flip_access(current_user: User = Depends(get_current_user)):
    """Get which sections the current user can access"""
    user_tier = current_user.tier or MemberTier.JUNIOR_RECRUIT
    
    # Get current tier settings
    settings = await db.flip_tier_settings.find_one({"type": "tier_access"}, {"_id": 0})
    tier_access = settings.get("access", {}) if settings else {}
    
    result = {}
    for section in FlipSectionType:
        required_tier = tier_access.get(section.value, DEFAULT_TIER_ACCESS[section].value)
        has_access = user_has_access(user_tier, MemberTier(required_tier))
        
        result[section.value] = {
            "has_access": has_access,
            "required_tier": required_tier,
            "title": SECTION_INFO[section]["title"],
            "description": SECTION_INFO[section]["description"]
        }
    
    return {
        "user_tier": user_tier.value,
        "sections": result
    }

# ============ OPPORTUNITY SUBMISSIONS ============

@router.post("/submit-opportunity")
async def submit_opportunity(
    content: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user)
):
    """Member submits an opportunity with optional attachments"""
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    # Process attachments
    attachments = []
    for file in files:
        if file.filename:
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                           'application/pdf', 'application/msword',
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"File type not allowed: {file.filename}. Allowed: images, PDF, DOC, DOCX"
                )
            
            # Read and encode file (store as base64 in DB for simplicity)
            file_content = await file.read()
            if len(file_content) > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(status_code=400, detail=f"File too large: {file.filename}. Max 10MB.")
            
            attachments.append({
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content),
                "data": base64.b64encode(file_content).decode('utf-8')
            })
    
    submission = {
        "id": str(uuid4()),
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "content": content.strip(),
        "attachments": attachments,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.flip_submissions.insert_one(submission)
    
    return {
        "message": "Opportunity submitted successfully. A director will review it shortly.",
        "submission_id": submission["id"]
    }

@router.get("/my-submissions")
async def get_my_submissions(current_user: User = Depends(get_current_user)):
    """Get member's own submissions"""
    submissions = await db.flip_submissions.find(
        {"user_id": current_user.id},
        {"_id": 0, "attachments.data": 0}  # Exclude attachment data for listing
    ).sort("submitted_at", -1).to_list(100)
    
    return submissions

# ============ ADMIN SUBMISSION MANAGEMENT ============

@router.get("/admin/submissions")
async def get_all_submissions(
    status: Optional[str] = None,
    admin_user: User = Depends(get_admin_user)
):
    """Admin gets all opportunity submissions"""
    query = {}
    if status:
        query["status"] = status
    
    submissions = await db.flip_submissions.find(
        query,
        {"_id": 0, "attachments.data": 0}  # Exclude attachment data for listing
    ).sort("submitted_at", -1).to_list(1000)
    
    return submissions

@router.get("/admin/submission/{submission_id}")
async def get_submission_detail(
    submission_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin gets full submission details including attachments"""
    submission = await db.flip_submissions.find_one(
        {"id": submission_id},
        {"_id": 0}
    )
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission

@router.post("/admin/submission/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin updates submission status"""
    if status not in ["pending", "reviewed", "archived", "achieved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "status": status,
    }
    
    if status == "reviewed":
        update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["reviewed_by"] = admin_user.id
    elif status == "achieved":
        update_data["achieved_at"] = datetime.now(timezone.utc).isoformat()
        update_data["achieved_by"] = admin_user.id
    
    result = await db.flip_submissions.update_one(
        {"id": submission_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return {"message": f"Submission marked as {status}"}

@router.get("/admin/attachment/{submission_id}/{filename}")
async def get_attachment(
    submission_id: str,
    filename: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin downloads an attachment"""
    submission = await db.flip_submissions.find_one(
        {"id": submission_id},
        {"_id": 0, "attachments": 1}
    )
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    for attachment in submission.get("attachments", []):
        if attachment["filename"] == filename:
            return {
                "filename": attachment["filename"],
                "content_type": attachment["content_type"],
                "data": attachment["data"]
            }
    
    raise HTTPException(status_code=404, detail="Attachment not found")
