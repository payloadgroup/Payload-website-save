from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from models.schemas import User, UserStatus
from utils.dependencies import get_current_user
from utils.database import db
from utils.auth import verify_password, hash_password

router = APIRouter(prefix="/users", tags=["users"])

class ProfileUpdate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    credit_score: Optional[str] = None
    onboarding_complete: Optional[bool] = None

class ChangeEmailRequest(BaseModel):
    new_email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    return user

@router.put("/profile")
async def update_profile(profile: ProfileUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    return {"message": "Profile updated"}

@router.put("/change-email")
async def change_email(request: ChangeEmailRequest, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    existing = await db.users.find_one({"email": request.new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    await db.users.update_one({"id": current_user.id}, {"$set": {"email": request.new_email}})
    return {"message": "Email updated"}

@router.put("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not verify_password(request.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = hash_password(request.new_password)
    await db.users.update_one({"id": current_user.id}, {"$set": {"password": new_hash}})
    return {"message": "Password updated"}

@router.get("/my-referral-code")
async def get_my_referral_code(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return {
        "own_referral_code": user.get("own_referral_code"),
        "referral_count": user.get("referral_count", 0)
    }

@router.get("/my-referrals")
async def get_my_referrals(current_user: User = Depends(get_current_user)):
    referrals = await db.users.find(
        {"referred_by": current_user.id},
        {"_id": 0, "password": 0}
    ).to_list(100)
    return referrals
