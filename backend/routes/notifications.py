from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from models.schemas import User
from utils.dependencies import get_admin_user
from utils.database import db
import os
import httpx
from datetime import datetime, timezone

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationSettings(BaseModel):
    whatsapp_enabled: bool = False
    whatsapp_number: Optional[str] = None
    email_enabled: bool = True
    admin_email: Optional[str] = None

@router.get("/settings")
async def get_notification_settings(admin_user: User = Depends(get_admin_user)):
    settings = await db.notification_settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {
            "whatsapp_enabled": False,
            "whatsapp_number": None,
            "email_enabled": True,
            "admin_email": None
        }
    return settings

@router.put("/settings")
async def update_notification_settings(
    settings: NotificationSettings,
    admin_user: User = Depends(get_admin_user)
):
    await db.notification_settings.update_one(
        {},
        {"$set": settings.model_dump()},
        upsert=True
    )
    return {"message": "Settings updated"}

async def send_new_registration_notification(user_data: dict):
    """Send notification when new user registers"""
    settings = await db.notification_settings.find_one({}, {"_id": 0})
    if not settings or not settings.get("whatsapp_enabled"):
        return
    
    whatsapp_number = settings.get("whatsapp_number")
    if not whatsapp_number:
        return
    
    # Calculate age
    dob = user_data.get("date_of_birth", "")
    age = "N/A"
    if dob:
        try:
            birth = datetime.strptime(dob, "%Y-%m-%d")
            today = datetime.now()
            age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except:
            pass
    
    message = f"""*NEW PAYLOAD REGISTRATION*

Name: {user_data.get('name', 'N/A')}
Age: {age}
Email: {user_data.get('email', 'N/A')}
Phone: {user_data.get('mobile', 'N/A')}

Pending approval in admin panel."""
    
    # Log the notification (actual WhatsApp integration would require Twilio/WhatsApp Business API)
    await db.notification_logs.insert_one({
        "type": "new_registration",
        "target": whatsapp_number,
        "message": message,
        "user_id": user_data.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "logged"  # Would be 'sent' with real integration
    })
    
    print(f"WhatsApp notification logged for {whatsapp_number}: New registration from {user_data.get('name')}")
