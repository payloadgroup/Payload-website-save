from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

class UserRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    LOCKED = "locked"

class PayloadStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class MissionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"

class StationStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class MemberTier(str, Enum):
    CADET = "cadet"
    LIEUTENANT = "lieutenant"
    COMMANDER = "commander"
    ADMIRAL = "admiral"

class AnnouncementPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobile: str
    date_of_birth: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: EmailStr
    mobile: Optional[str] = None
    date_of_birth: Optional[str] = None
    role: UserRole
    status: UserStatus
    tier: Optional[MemberTier] = MemberTier.CADET
    referral_code: Optional[str] = None  # Code they used to sign up
    own_referral_code: Optional[str] = None  # Their code to share
    referred_by: Optional[str] = None
    referral_count: int = 0
    last_login: Optional[str] = None
    login_count: int = 0
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class UserApprovalRequest(BaseModel):
    user_id: str
    status: UserStatus

class UpdateTierRequest(BaseModel):
    user_id: str
    tier: MemberTier

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: AnnouncementPriority = AnnouncementPriority.NORMAL
    is_pinned: bool = False
    target_tiers: Optional[List[MemberTier]] = None  # None means all tiers
    scheduled_for: Optional[str] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[AnnouncementPriority] = None
    is_pinned: Optional[bool] = None
    target_tiers: Optional[List[MemberTier]] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    priority: AnnouncementPriority
    is_pinned: bool
    is_active: bool
    target_tiers: Optional[List[MemberTier]] = None
    created_by: str
    created_at: str
    scheduled_for: Optional[str] = None
    read_by: List[str] = []

class ReferralStats(BaseModel):
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    top_referrers: List[dict]

class ActivityStats(BaseModel):
    total_members: int
    active_last_7_days: int
    active_last_30_days: int
    inactive_members: int
    tier_distribution: dict
    recent_logins: List[dict]

class PayloadCreate(BaseModel):
    title: str
    description: str
    funding_goal: float = 0.0
    current_funding: float = 0.0
    assigned_to: str

class PayloadUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PayloadStatus] = None
    funding_goal: Optional[float] = None
    current_funding: Optional[float] = None
    assigned_to: Optional[str] = None

class PayloadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assigned_to: str
    created_by: str
    title: str
    description: str
    status: PayloadStatus
    funding_goal: float
    current_funding: float
    is_active: bool
    created_at: str
    updated_at: str

class MissionCreate(BaseModel):
    title: str
    objective: str
    payload_id: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"
    assigned_to: str

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    objective: Optional[str] = None
    status: Optional[MissionStatus] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None

class MissionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assigned_to: str
    created_by: str
    payload_id: Optional[str] = None
    title: str
    objective: str
    status: MissionStatus
    due_date: Optional[str] = None
    priority: str
    is_active: bool
    created_at: str

class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    description: str
    category: str = "general"

class TransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: TransactionType
    amount: float
    description: str
    category: str
    balance_after: float
    date: str

class HeadquartersCreate(BaseModel):
    name: str
    location: str
    description: str

class HeadquartersUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class HeadquartersResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    location: str
    description: str
    established_date: str

class StationCreate(BaseModel):
    name: str
    location: str
    type: str
    description: str = ""

class StationUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StationStatus] = None

class StationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    location: str
    type: str
    description: str
    status: StationStatus
    established_date: str

class ResourceCreate(BaseModel):
    title: str
    description: str
    type: str
    url: str = ""

class ResourceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    type: str
    url: str
    uploaded_by: str
    created_at: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def generate_referral_code(name: str) -> str:
    import uuid
    import hashlib
    # Generate a unique referral code based on name and random uuid
    base = f"{name.upper().replace(' ', '')[:4]}"
    unique_part = hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()[:6].upper()
    return f"{base}{unique_part}"

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    import uuid
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    
    # Generate unique referral code for this user
    own_referral_code = generate_referral_code(user_data.name)
    
    # Check if they were referred by someone
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
        "tier": MemberTier.CADET,
        "referral_code": user_data.referral_code,  # Code they used to sign up
        "own_referral_code": own_referral_code,  # Their own code to share
        "referred_by": referred_by,
        "referral_count": 0,
        "last_login": None,
        "login_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    new_user.pop("password")
    return User(**new_user)

@api_router.post("/auth/login", response_model=Token)
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
    
    # Update last login and login count
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

@api_router.get("/users/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/admin/pending-users", response_model=List[User])
async def get_pending_users(admin_user: User = Depends(get_admin_user)):
    pending_users = await db.users.find(
        {"status": UserStatus.PENDING},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in pending_users]

@api_router.get("/admin/members", response_model=List[User])
async def get_all_members(admin_user: User = Depends(get_admin_user)):
    members = await db.users.find(
        {"role": UserRole.MEMBER, "status": UserStatus.APPROVED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in members]

@api_router.get("/admin/locked-users", response_model=List[User])
async def get_locked_users(admin_user: User = Depends(get_admin_user)):
    locked_users = await db.users.find(
        {"status": UserStatus.LOCKED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in locked_users]

@api_router.post("/admin/lock-user/{user_id}")
async def lock_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot lock admin accounts")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": UserStatus.LOCKED}}
    )
    
    return {"message": "User account locked successfully"}

@api_router.post("/admin/unlock-user/{user_id}")
async def unlock_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": UserStatus.APPROVED}}
    )
    
    return {"message": "User account unlocked successfully"}

@api_router.delete("/admin/delete-user/{user_id}")
async def delete_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete admin accounts")
    
    # Delete user's related data
    await db.payloads.delete_many({"assigned_to": user_id})
    await db.missions.delete_many({"assigned_to": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.headquarters.delete_many({"user_id": user_id})
    await db.stations.delete_many({"user_id": user_id})
    
    # Delete the user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete user")
    
    return {"message": "User account and related data deleted successfully"}

# ============ MEMBER TIER MANAGEMENT ============

@api_router.post("/admin/update-tier")
async def update_member_tier(
    request: UpdateTierRequest,
    admin_user: User = Depends(get_admin_user)
):
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot change admin tier")
    
    result = await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"tier": request.tier}}
    )
    
    return {"message": f"User tier updated to {request.tier}"}

@api_router.get("/admin/members-by-tier/{tier}", response_model=List[User])
async def get_members_by_tier(tier: MemberTier, admin_user: User = Depends(get_admin_user)):
    members = await db.users.find(
        {"role": UserRole.MEMBER, "status": UserStatus.APPROVED, "tier": tier},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return [User(**user) for user in members]

# ============ ANNOUNCEMENTS ============

@api_router.post("/admin/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    announcement: AnnouncementCreate,
    admin_user: User = Depends(get_admin_user)
):
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

@api_router.get("/admin/announcements", response_model=List[AnnouncementResponse])
async def get_all_announcements(admin_user: User = Depends(get_admin_user)):
    announcements = await db.announcements.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [AnnouncementResponse(**a) for a in announcements]

@api_router.put("/admin/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: str,
    update: AnnouncementUpdate,
    admin_user: User = Depends(get_admin_user)
):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.announcements.update_one(
        {"id": announcement_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    updated = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    return AnnouncementResponse(**updated)

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    admin_user: User = Depends(get_admin_user)
):
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}

@api_router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_member_announcements(current_user: User = Depends(get_current_user)):
    # Get announcements visible to this user's tier
    query = {"is_active": True}
    
    announcements = await db.announcements.find(
        query,
        {"_id": 0}
    ).sort([("is_pinned", -1), ("created_at", -1)]).to_list(50)
    
    # Filter by tier if target_tiers is set
    user_tier = current_user.tier or MemberTier.CADET
    filtered = []
    for a in announcements:
        if a.get("target_tiers") is None or user_tier in a.get("target_tiers", []):
            filtered.append(AnnouncementResponse(**a))
    
    return filtered

@api_router.post("/announcements/{announcement_id}/read")
async def mark_announcement_read(
    announcement_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.announcements.update_one(
        {"id": announcement_id},
        {"$addToSet": {"read_by": current_user.id}}
    )
    return {"message": "Marked as read"}

# ============ ACTIVITY MONITORING ============

@api_router.get("/admin/activity-stats")
async def get_activity_stats(admin_user: User = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    total_members = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED})
    
    # Active in last 7 days
    active_7 = await db.users.count_documents({
        "role": UserRole.MEMBER,
        "status": UserStatus.APPROVED,
        "last_login": {"$gte": seven_days_ago}
    })
    
    # Active in last 30 days
    active_30 = await db.users.count_documents({
        "role": UserRole.MEMBER,
        "status": UserStatus.APPROVED,
        "last_login": {"$gte": thirty_days_ago}
    })
    
    # Inactive (no login in 30+ days or never logged in)
    inactive = total_members - active_30
    
    # Tier distribution
    tier_distribution = {}
    for tier in MemberTier:
        count = await db.users.count_documents({
            "role": UserRole.MEMBER,
            "status": UserStatus.APPROVED,
            "tier": tier
        })
        tier_distribution[tier.value] = count
    
    # Recent logins (last 20)
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

@api_router.get("/admin/inactive-members", response_model=List[User])
async def get_inactive_members(days: int = 30, admin_user: User = Depends(get_admin_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Members who haven't logged in since cutoff or never logged in
    inactive = await db.users.find(
        {
            "role": UserRole.MEMBER,
            "status": UserStatus.APPROVED,
            "$or": [
                {"last_login": {"$lt": cutoff}},
                {"last_login": None}
            ]
        },
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return [User(**u) for u in inactive]

# ============ REFERRAL MANAGEMENT ============

@api_router.get("/admin/referral-stats")
async def get_referral_stats(admin_user: User = Depends(get_admin_user)):
    # Total referrals (users who were referred by someone)
    total_referrals = await db.users.count_documents({"referred_by": {"$ne": None}})
    
    # Successful referrals (approved users who were referred)
    successful_referrals = await db.users.count_documents({
        "referred_by": {"$ne": None},
        "status": UserStatus.APPROVED
    })
    
    # Pending referrals
    pending_referrals = await db.users.count_documents({
        "referred_by": {"$ne": None},
        "status": UserStatus.PENDING
    })
    
    # Top referrers
    top_referrers = await db.users.find(
        {"referral_count": {"$gt": 0}},
        {"_id": 0, "password": 0}
    ).sort("referral_count", -1).to_list(10)
    
    return {
        "total_referrals": total_referrals,
        "successful_referrals": successful_referrals,
        "pending_referrals": pending_referrals,
        "top_referrers": [{"id": u["id"], "name": u["name"], "referral_count": u.get("referral_count", 0), "own_referral_code": u.get("own_referral_code")} for u in top_referrers]
    }

@api_router.get("/admin/referrals-by-user/{user_id}")
async def get_user_referrals(user_id: str, admin_user: User = Depends(get_admin_user)):
    # Get all users referred by this user
    referrals = await db.users.find(
        {"referred_by": user_id},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return [User(**u) for u in referrals]

@api_router.get("/users/my-referral-code")
async def get_my_referral_code(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return {
        "own_referral_code": user.get("own_referral_code"),
        "referral_count": user.get("referral_count", 0)
    }

@api_router.post("/admin/update-user-status")
async def update_user_status(
    request: UserApprovalRequest,
    admin_user: User = Depends(get_admin_user)
):
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"status": request.status}}
    )
    
    # If user is being approved and they were referred by someone, increment referrer's count
    if request.status == UserStatus.APPROVED and user.get("referred_by"):
        await db.users.update_one(
            {"id": user["referred_by"]},
            {"$inc": {"referral_count": 1}}
        )
    
    return {"message": f"User status updated to {request.status}"}

@api_router.get("/admin/analytics")
async def get_analytics(admin_user: User = Depends(get_admin_user)):
    total_members = await db.users.count_documents({"role": UserRole.MEMBER})
    approved_members = await db.users.count_documents({"role": UserRole.MEMBER, "status": UserStatus.APPROVED})
    pending_members = await db.users.count_documents({"status": UserStatus.PENDING})
    
    total_payloads = await db.payloads.count_documents({})
    active_payloads = await db.payloads.count_documents({"status": PayloadStatus.ACTIVE})
    
    total_missions = await db.missions.count_documents({})
    completed_missions = await db.missions.count_documents({"status": MissionStatus.COMPLETED})
    
    total_transactions = await db.transactions.count_documents({})
    
    recent_members = await db.users.find(
        {"role": UserRole.MEMBER},
        {"_id": 0, "password": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
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

@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        payloads_count = await db.payloads.count_documents({})
        missions_count = await db.missions.count_documents({})
    else:
        payloads_count = await db.payloads.count_documents({"assigned_to": current_user.id, "is_active": True})
        missions_count = await db.missions.count_documents({"assigned_to": current_user.id, "is_active": True})
    
    transactions = await db.transactions.find(
        {"user_id": current_user.id}
    ).sort("date", -1).limit(1).to_list(1)
    
    balance = transactions[0]["balance_after"] if transactions else 0.0
    
    headquarters = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    stations_count = await db.stations.count_documents({"user_id": current_user.id})
    
    return {
        "welcome_message": f"Welcome to Payload, {current_user.name}",
        "member_since": current_user.created_at,
        "status": "Mission Control Online",
        "payloads_count": payloads_count,
        "missions_count": missions_count,
        "balance": balance,
        "headquarters": headquarters,
        "stations_count": stations_count
    }

@api_router.get("/payloads", response_model=List[PayloadResponse])
async def get_payloads(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        payloads = await db.payloads.find({}, {"_id": 0}).to_list(1000)
    else:
        payloads = await db.payloads.find(
            {"assigned_to": current_user.id},
            {"_id": 0}
        ).to_list(1000)
    return [PayloadResponse(**p) for p in payloads]

@api_router.post("/payloads", response_model=PayloadResponse)
async def create_payload(payload_data: PayloadCreate, admin_user: User = Depends(get_admin_user)):
    import uuid
    payload = {
        "id": str(uuid.uuid4()),
        "assigned_to": payload_data.assigned_to,
        "created_by": admin_user.id,
        "title": payload_data.title,
        "description": payload_data.description,
        "status": PayloadStatus.ACTIVE,
        "funding_goal": payload_data.funding_goal,
        "current_funding": payload_data.current_funding,
        "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payloads.insert_one(payload)
    return PayloadResponse(**payload)

@api_router.put("/payloads/{payload_id}", response_model=PayloadResponse)
async def update_payload(
    payload_id: str,
    payload_data: PayloadUpdate,
    admin_user: User = Depends(get_admin_user)
):
    update_data = {k: v for k, v in payload_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.payloads.update_one(
        {"id": payload_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payload not found")
    
    payload = await db.payloads.find_one({"id": payload_id}, {"_id": 0})
    return PayloadResponse(**payload)

@api_router.post("/payloads/{payload_id}/toggle-active")
async def toggle_payload_active(payload_id: str, current_user: User = Depends(get_current_user)):
    payload = await db.payloads.find_one({"id": payload_id, "assigned_to": current_user.id}, {"_id": 0})
    if not payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    
    new_active_state = not payload.get("is_active", False)
    await db.payloads.update_one(
        {"id": payload_id},
        {"$set": {"is_active": new_active_state}}
    )
    return {"message": "Payload activation toggled", "is_active": new_active_state}

@api_router.delete("/payloads/{payload_id}")
async def delete_payload(payload_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.payloads.delete_one({"id": payload_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payload not found")
    return {"message": "Payload deleted"}

@api_router.get("/missions", response_model=List[MissionResponse])
async def get_missions(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        missions = await db.missions.find({}, {"_id": 0}).to_list(1000)
    else:
        missions = await db.missions.find(
            {"assigned_to": current_user.id},
            {"_id": 0}
        ).to_list(1000)
    return [MissionResponse(**m) for m in missions]

@api_router.post("/missions", response_model=MissionResponse)
async def create_mission(mission_data: MissionCreate, admin_user: User = Depends(get_admin_user)):
    import uuid
    mission = {
        "id": str(uuid.uuid4()),
        "assigned_to": mission_data.assigned_to,
        "created_by": admin_user.id,
        "payload_id": mission_data.payload_id,
        "title": mission_data.title,
        "objective": mission_data.objective,
        "status": MissionStatus.PENDING,
        "due_date": mission_data.due_date,
        "priority": mission_data.priority,
        "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.missions.insert_one(mission)
    return MissionResponse(**mission)

@api_router.put("/missions/{mission_id}", response_model=MissionResponse)
async def update_mission(
    mission_id: str,
    mission_data: MissionUpdate,
    admin_user: User = Depends(get_admin_user)
):
    update_data = {k: v for k, v in mission_data.model_dump().items() if v is not None}
    
    result = await db.missions.update_one(
        {"id": mission_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    return MissionResponse(**mission)

@api_router.post("/missions/{mission_id}/toggle-active")
async def toggle_mission_active(mission_id: str, current_user: User = Depends(get_current_user)):
    mission = await db.missions.find_one({"id": mission_id, "assigned_to": current_user.id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    new_active_state = not mission.get("is_active", False)
    await db.missions.update_one(
        {"id": mission_id},
        {"$set": {"is_active": new_active_state}}
    )
    return {"message": "Mission activation toggled", "is_active": new_active_state}

@api_router.delete("/missions/{mission_id}")
async def delete_mission(mission_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.missions.delete_one({"id": mission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"message": "Mission deleted"}

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    return [TransactionResponse(**t) for t in transactions]

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    import uuid
    
    last_transaction = await db.transactions.find_one(
        {"user_id": current_user.id},
        {"_id": 0},
        sort=[("date", -1)]
    )
    
    current_balance = last_transaction["balance_after"] if last_transaction else 0.0
    
    if transaction_data.type == TransactionType.DEPOSIT:
        new_balance = current_balance + transaction_data.amount
    else:
        new_balance = current_balance - transaction_data.amount
    
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "type": transaction_data.type,
        "amount": transaction_data.amount,
        "description": transaction_data.description,
        "category": transaction_data.category,
        "balance_after": new_balance,
        "date": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    return TransactionResponse(**transaction)

@api_router.get("/bank/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    last_transaction = await db.transactions.find_one(
        {"user_id": current_user.id},
        {"_id": 0},
        sort=[("date", -1)]
    )
    balance = last_transaction["balance_after"] if last_transaction else 0.0
    return {"balance": balance}

@api_router.get("/headquarters", response_model=Optional[HeadquartersResponse])
async def get_headquarters(current_user: User = Depends(get_current_user)):
    hq = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    return HeadquartersResponse(**hq) if hq else None

@api_router.post("/headquarters", response_model=HeadquartersResponse)
async def create_headquarters(hq_data: HeadquartersCreate, current_user: User = Depends(get_current_user)):
    existing = await db.headquarters.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Headquarters already exists")
    
    import uuid
    hq = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "name": hq_data.name,
        "location": hq_data.location,
        "description": hq_data.description,
        "established_date": datetime.now(timezone.utc).isoformat()
    }
    await db.headquarters.insert_one(hq)
    return HeadquartersResponse(**hq)

@api_router.put("/headquarters", response_model=HeadquartersResponse)
async def update_headquarters(hq_data: HeadquartersUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in hq_data.model_dump().items() if v is not None}
    
    result = await db.headquarters.update_one(
        {"user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Headquarters not found")
    
    hq = await db.headquarters.find_one({"user_id": current_user.id}, {"_id": 0})
    return HeadquartersResponse(**hq)

@api_router.get("/stations", response_model=List[StationResponse])
async def get_stations(current_user: User = Depends(get_current_user)):
    stations = await db.stations.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    return [StationResponse(**s) for s in stations]

@api_router.post("/stations", response_model=StationResponse)
async def create_station(station_data: StationCreate, current_user: User = Depends(get_current_user)):
    import uuid
    station = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "name": station_data.name,
        "location": station_data.location,
        "type": station_data.type,
        "description": station_data.description,
        "status": StationStatus.ACTIVE,
        "established_date": datetime.now(timezone.utc).isoformat()
    }
    await db.stations.insert_one(station)
    return StationResponse(**station)

@api_router.put("/stations/{station_id}", response_model=StationResponse)
async def update_station(
    station_id: str,
    station_data: StationUpdate,
    current_user: User = Depends(get_current_user)
):
    update_data = {k: v for k, v in station_data.model_dump().items() if v is not None}
    
    result = await db.stations.update_one(
        {"id": station_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    
    station = await db.stations.find_one({"id": station_id}, {"_id": 0})
    return StationResponse(**station)

@api_router.delete("/stations/{station_id}")
async def delete_station(station_id: str, current_user: User = Depends(get_current_user)):
    result = await db.stations.delete_one({"id": station_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    return {"message": "Station deleted"}

@api_router.get("/basecamp", response_model=List[ResourceResponse])
async def get_resources(current_user: User = Depends(get_current_user)):
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    return [ResourceResponse(**r) for r in resources]

@api_router.post("/basecamp", response_model=ResourceResponse)
async def create_resource(resource_data: ResourceCreate, admin_user: User = Depends(get_admin_user)):
    import uuid
    resource = {
        "id": str(uuid.uuid4()),
        "title": resource_data.title,
        "description": resource_data.description,
        "type": resource_data.type,
        "url": resource_data.url,
        "uploaded_by": admin_user.id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.resources.insert_one(resource)
    return ResourceResponse(**resource)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def create_admin_user():
    admin_exists = await db.users.find_one({"role": UserRole.ADMIN})
    if not admin_exists:
        import uuid
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": "admin@payload.com",
            "password": hash_password("admin123"),
            "role": UserRole.ADMIN,
            "status": UserStatus.APPROVED,
            "referral_code": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created: admin@payload.com / admin123")