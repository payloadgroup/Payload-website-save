from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timezone, timedelta
import uuid
import base64

from models.schemas import (
    UserRegister, UserLogin, User, Token,
    UserRole, UserStatus, MemberTier
)
from utils.database import db
from utils.auth import (
    hash_password, verify_password, create_access_token,
    generate_referral_code, ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.email import send_registration_pending_email

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=User)
async def register(user_data: UserRegister, background_tasks: BackgroundTasks):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    own_referral_code = generate_referral_code(user_data.name)
    
    referred_by = None
    if user_data.referral_code:
        referrer = await db.users.find_one({"own_referral_code": user_data.referral_code}, {"_id": 0})
        if referrer:
            referred_by = referrer["id"]
    
    new_user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pwd,
        "mobile": user_data.mobile,
        "date_of_birth": user_data.date_of_birth,
        "role": UserRole.MEMBER,
        "status": UserStatus.PENDING,
        "tier": MemberTier.JUNIOR_RECRUIT,
        "referral_code": user_data.referral_code,
        "own_referral_code": own_referral_code,
        "referred_by": referred_by,
        "referral_count": 0,
        "last_login": None,
        "login_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    # Send registration pending email in background
    background_tasks.add_task(send_registration_pending_email, user_data.email, user_data.name)
    
    new_user.pop("password")
    return User(**new_user)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user["status"] == UserStatus.PENDING:
        raise HTTPException(status_code=403, detail="Your registration is pending approval")
    
    if user["status"] == UserStatus.DENIED:
        raise HTTPException(status_code=403, detail="Your registration has been denied")
    
    if user["status"] == UserStatus.LOCKED:
        raise HTTPException(status_code=403, detail="Your account has been locked. Please contact admin.")
    
    current_time = datetime.now(timezone.utc).isoformat()
    login_count = user.get("login_count", 0) + 1
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": current_time, "login_count": login_count}}
    )
    user["last_login"] = current_time
    user["login_count"] = login_count
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user.pop("password")
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user)
    )
