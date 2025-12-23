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
    files: Optional[List[UploadFile]] = File(default=None),
    current_user: User = Depends(get_current_user)
):
    """Member submits an opportunity with optional attachments"""
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    # Process attachments
    attachments = []
    if files:
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


# ============ PLAYS (OPPORTUNITIES) SYSTEM ============

@router.get("/plays/{section}")
async def get_plays_for_section(
    section: FlipSectionType,
    current_user: User = Depends(get_current_user)
):
    """Get all plays for a section (checks access for members)"""
    user_tier = current_user.tier or MemberTier.JUNIOR_RECRUIT
    is_admin = current_user.role == "admin"
    
    # Check access for members
    if not is_admin:
        settings = await db.flip_tier_settings.find_one({"type": "tier_access"}, {"_id": 0})
        tier_access = settings.get("access", {}) if settings else {}
        required_tier = tier_access.get(section.value, DEFAULT_TIER_ACCESS[section].value)
        
        if not user_has_access(user_tier, MemberTier(required_tier)):
            raise HTTPException(status_code=403, detail="You don't have access to this section")
    
    # Get plays with participant counts
    plays = await db.flip_plays.find(
        {"section": section, "is_active": True} if not is_admin else {"section": section},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add participant counts
    for play in plays:
        count = await db.play_participants.count_documents({"play_id": play["id"]})
        play["participant_count"] = count
    
    return plays


@router.post("/plays", response_model=PlayResponse)
async def create_play(
    play_data: PlayCreate,
    admin_user: User = Depends(get_admin_user)
):
    """Admin creates a new play/opportunity"""
    play = {
        "id": str(uuid4()),
        "title": play_data.title,
        "description": play_data.description,
        "section": play_data.section,
        "min_investment": play_data.min_investment,
        "expected_return": play_data.expected_return,
        "deadline": play_data.deadline,
        "is_active": play_data.is_active,
        "participant_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin_user.id
    }
    
    await db.flip_plays.insert_one(play)
    return PlayResponse(**play)


@router.put("/plays/{play_id}", response_model=PlayResponse)
async def update_play(
    play_id: str,
    play_data: PlayUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Admin updates a play"""
    update_data = {k: v for k, v in play_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = admin_user.id
    
    result = await db.flip_plays.update_one({"id": play_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Play not found")
    
    play = await db.flip_plays.find_one({"id": play_id}, {"_id": 0})
    count = await db.play_participants.count_documents({"play_id": play_id})
    play["participant_count"] = count
    return PlayResponse(**play)


@router.delete("/plays/{play_id}")
async def delete_play(
    play_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin deletes a play"""
    result = await db.flip_plays.delete_one({"id": play_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Play not found")
    
    # Also delete participations
    await db.play_participants.delete_many({"play_id": play_id})
    
    return {"message": "Play deleted successfully"}


# ============ PLAY PARTICIPATION ============

@router.post("/plays/{play_id}/join")
async def join_play(
    play_id: str,
    current_user: User = Depends(get_current_user)
):
    """Member joins a play/opportunity"""
    # Check if play exists and is active
    play = await db.flip_plays.find_one({"id": play_id, "is_active": True}, {"_id": 0})
    if not play:
        raise HTTPException(status_code=404, detail="Play not found or inactive")
    
    # Check user access to section
    user_tier = current_user.tier or MemberTier.JUNIOR_RECRUIT
    settings = await db.flip_tier_settings.find_one({"type": "tier_access"}, {"_id": 0})
    tier_access = settings.get("access", {}) if settings else {}
    required_tier = tier_access.get(play["section"], DEFAULT_TIER_ACCESS[FlipSectionType(play["section"])].value)
    
    if not user_has_access(user_tier, MemberTier(required_tier)):
        raise HTTPException(status_code=403, detail="You don't have access to this section")
    
    # Check if already joined
    existing = await db.play_participants.find_one({
        "play_id": play_id,
        "user_id": current_user.id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already joined this play")
    
    participation = {
        "id": str(uuid4()),
        "play_id": play_id,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "contact_status": ContactStatus.NOT_CONTACTED,
        "joined_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.play_participants.insert_one(participation)
    
    return {
        "message": "You have successfully joined this play. You will receive instructions soon.",
        "participation_id": participation["id"]
    }


@router.get("/plays/{play_id}/my-status")
async def get_my_play_status(
    play_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if current user has joined a play"""
    participation = await db.play_participants.find_one({
        "play_id": play_id,
        "user_id": current_user.id
    }, {"_id": 0})
    
    return {
        "joined": participation is not None,
        "participation": participation
    }


@router.get("/plays/{play_id}/participants")
async def get_play_participants(
    play_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin gets list of participants for a play"""
    participants = await db.play_participants.find(
        {"play_id": play_id},
        {"_id": 0}
    ).sort("joined_at", -1).to_list(1000)
    
    # Enrich with user profile data
    for participant in participants:
        user = await db.users.find_one(
            {"id": participant["user_id"]},
            {"_id": 0, "password": 0}
        )
        if user:
            participant["user_mobile"] = user.get("mobile")
            participant["user_tier"] = user.get("tier")
            participant["gmail_account"] = user.get("gmail_account")
    
    return participants


@router.put("/plays/{play_id}/participants/{user_id}/contact-status")
async def update_participant_contact_status(
    play_id: str,
    user_id: str,
    status_update: PlayParticipantUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Admin updates contact status for a participant"""
    result = await db.play_participants.update_one(
        {"play_id": play_id, "user_id": user_id},
        {"$set": {
            "contact_status": status_update.contact_status,
            "contact_updated_at": datetime.now(timezone.utc).isoformat(),
            "contact_updated_by": admin_user.id
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    return {"message": "Contact status updated"}


# ============ ADMIN PLAY STATS ============

@router.get("/admin/plays/stats")
async def get_plays_stats(admin_user: User = Depends(get_admin_user)):
    """Get overall plays statistics"""
    total_plays = await db.flip_plays.count_documents({})
    active_plays = await db.flip_plays.count_documents({"is_active": True})
    total_participants = await db.play_participants.count_documents({})
    
    # Stats per section
    section_stats = {}
    for section in FlipSectionType:
        plays_count = await db.flip_plays.count_documents({"section": section})
        section_stats[section.value] = {
            "plays_count": plays_count,
            "title": SECTION_INFO[section]["title"]
        }
    
    return {
        "total_plays": total_plays,
        "active_plays": active_plays,
        "total_participants": total_participants,
        "section_stats": section_stats
    }


# ============ CRYPTO SUBMISSIONS (Arbitrage) ============

@router.post("/plays/{play_id}/crypto-submission")
async def submit_crypto_details(
    play_id: str,
    name: str = Form(...),
    contact_number: Optional[str] = Form(None),
    telegram_handle: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Member submits additional details after joining a Crypto play in Arbitrage"""
    # Verify play exists and is in arbitrage section
    play = await db.flip_plays.find_one({"id": play_id}, {"_id": 0})
    if not play:
        raise HTTPException(status_code=404, detail="Play not found")
    
    # Check if user is a participant
    participation = await db.play_participants.find_one({
        "play_id": play_id,
        "user_id": current_user.id
    })
    if not participation:
        raise HTTPException(status_code=403, detail="You must join this play first")
    
    # Check if already submitted
    existing = await db.crypto_submissions.find_one({
        "play_id": play_id,
        "user_id": current_user.id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted your details")
    
    submission = {
        "id": str(uuid4()),
        "play_id": play_id,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "name": name,
        "contact_number": contact_number,
        "telegram_handle": telegram_handle,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.crypto_submissions.insert_one(submission)
    
    return {
        "message": "Your details have been submitted successfully",
        "submission_id": submission["id"]
    }


@router.get("/plays/{play_id}/crypto-submission/my-status")
async def get_my_crypto_submission_status(
    play_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if current user has submitted crypto details"""
    submission = await db.crypto_submissions.find_one({
        "play_id": play_id,
        "user_id": current_user.id
    }, {"_id": 0})
    
    return {
        "submitted": submission is not None,
        "submission": submission
    }


@router.get("/plays/{play_id}/crypto-submissions")
async def get_crypto_submissions(
    play_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin gets all crypto submissions for a play"""
    submissions = await db.crypto_submissions.find(
        {"play_id": play_id},
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(1000)
    
    return submissions


@router.get("/plays/{play_id}/crypto-submissions/count")
async def get_crypto_submission_count(
    play_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get count of crypto submissions for a play"""
    count = await db.crypto_submissions.count_documents({"play_id": play_id})
    return {"count": count}
