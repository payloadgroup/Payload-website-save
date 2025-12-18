from fastapi import APIRouter, Depends
from models.schemas import User
from utils.dependencies import get_current_user
from utils.database import db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/my-referral-code")
async def get_my_referral_code(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return {
        "own_referral_code": user.get("own_referral_code"),
        "referral_count": user.get("referral_count", 0)
    }
