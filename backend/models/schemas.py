from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    LOCKED = "locked"
    DELETED = "deleted"

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

# Intelligence-based tiers
class MemberTier(str, Enum):
    JUNIOR_RECRUIT = "junior_recruit"
    FRONT_LINE = "front_line"
    MID_LEVEL_MANAGER = "mid_level_manager"
    SENIOR_MANAGER = "senior_manager"
    TOP_LEADERSHIP = "top_leadership"

class AnnouncementPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

# User Models
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
    tier: Optional[MemberTier] = MemberTier.JUNIOR_RECRUIT
    referral_code: Optional[str] = None
    own_referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    referral_count: int = 0
    last_login: Optional[str] = None
    login_count: int = 0
    created_at: str
    credit_score: Optional[str] = None
    gmail_account: Optional[str] = None

# Work Zone Models
class WorkZoneSettingsUpdate(BaseModel):
    admin_google_email: str

class WorkZoneSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    admin_google_email: Optional[str] = None
    updated_at: Optional[str] = None

class GmailAccountUpdate(BaseModel):
    gmail_account: str

class WorkZoneAccessStatus(str, Enum):
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WorkZoneAccessRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    user_name: str
    user_email: str
    gmail_account: str
    requested_at: str
    status: WorkZoneAccessStatus = WorkZoneAccessStatus.PENDING

class WorkZoneMemberStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    user_name: str
    user_email: str
    gmail_account: Optional[str] = None
    workzone_status: WorkZoneAccessStatus = WorkZoneAccessStatus.NONE
    requested_at: Optional[str] = None

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

class CreateMemberRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobile: Optional[str] = None
    date_of_birth: Optional[str] = None
    tier: MemberTier = MemberTier.JUNIOR_RECRUIT

# Announcement Models
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: AnnouncementPriority = AnnouncementPriority.NORMAL
    is_pinned: bool = False
    target_tiers: Optional[List[MemberTier]] = None
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

# Payload Models
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

# Mission Models
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

# Transaction Models
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

# Headquarters Models
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

# Station Models
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

# Resource Models
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
