from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User, UserRole, BusinessType, TaskStatus,
    TaskTemplateCreate, TaskTemplateUpdate, TaskTemplateResponse,
    MemberProjectResponse, MemberTaskResponse, TaskStatusUpdate,
    MemberProgressResponse
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/projects", tags=["projects"])

# Business name mapping
BUSINESS_NAMES = {
    BusinessType.CENSORED_REFERRALS: "Censored Referrals",
    BusinessType.GUARANTEED_FLIPS: "Guaranteed Flips",
    BusinessType.SOLARHEX: "SolarHex",
    BusinessType.ICEBERG_TECHNOLOGIES: "Iceberg Technologies",
    BusinessType.CPOD: "CPOD",
    BusinessType.PAYLOAD_FINTECH: "Payload Fintech",
    BusinessType.PAYBOND: "PayBond",
    BusinessType.H2_GREEN_PRODUCTION: "H2 Green Production"
}

# Default tasks for each business type
DEFAULT_TASKS = {
    BusinessType.CENSORED_REFERRALS: [
        {"title": "Share your referral code", "description": "Copy and share your unique referral code with potential members", "order": 1},
        {"title": "Post on social media", "description": "Create engaging content about Payload on your preferred platform", "order": 2},
        {"title": "Get your first referral", "description": "Successfully refer one new member to Payload", "order": 3},
        {"title": "Reach 3 referrals", "description": "Grow your network to 3 successful referrals", "order": 4},
        {"title": "Achieve tier upgrade", "description": "Reach enough referrals to upgrade your member tier", "order": 5}
    ],
    BusinessType.GUARANTEED_FLIPS: [
        {"title": "Review available opportunities", "description": "Browse through the current flip opportunities in your tier", "order": 1},
        {"title": "Submit interest form", "description": "Express interest in a specific opportunity", "order": 2},
        {"title": "Complete due diligence", "description": "Review all documentation and verify opportunity details", "order": 3},
        {"title": "Execute transaction", "description": "Complete the purchase/investment transaction", "order": 4},
        {"title": "Complete flip", "description": "Successfully exit the position with profit", "order": 5}
    ],
    BusinessType.SOLARHEX: [
        {"title": "Review solar infrastructure plans", "description": "Understand the SolarHex rental system and mining operations", "order": 1},
        {"title": "Calculate investment requirements", "description": "Determine your investment capacity and expected returns", "order": 2},
        {"title": "Submit participation form", "description": "Apply to participate in the solar infrastructure program", "order": 3},
        {"title": "Complete funding contribution", "description": "Transfer your investment amount to the project fund", "order": 4},
        {"title": "Monitor mining operations", "description": "Track your share of the cryptocurrency mining output", "order": 5}
    ],
    BusinessType.ICEBERG_TECHNOLOGIES: [
        {"title": "Review property opportunities", "description": "Explore available downward development projects", "order": 1},
        {"title": "Understand regulatory requirements", "description": "Study the compliance requirements for your jurisdiction", "order": 2},
        {"title": "Submit investment interest", "description": "Express interest in participating in a development", "order": 3},
        {"title": "Complete investment documentation", "description": "Sign all required legal and financial documents", "order": 4},
        {"title": "Track development progress", "description": "Monitor construction milestones and project completion", "order": 5}
    ],
    BusinessType.CPOD: [
        {"title": "Register as dispatch partner", "description": "Complete the CPOD partner registration process", "order": 1},
        {"title": "Set up delivery zones", "description": "Define your preferred delivery areas and availability", "order": 2},
        {"title": "Complete training module", "description": "Finish the care package handling certification", "order": 3},
        {"title": "Execute first delivery", "description": "Successfully complete your first care package delivery", "order": 4},
        {"title": "Achieve partner status", "description": "Reach the required number of successful deliveries", "order": 5}
    ],
    BusinessType.PAYLOAD_FINTECH: [
        {"title": "Review fintech ecosystem", "description": "Understand the investor-company matching platform", "order": 1},
        {"title": "Complete investor profile", "description": "Fill out your investment preferences and capacity", "order": 2},
        {"title": "Review matched opportunities", "description": "Explore companies matched to your profile", "order": 3},
        {"title": "Execute first investment", "description": "Complete your first non-equity financing deal", "order": 4},
        {"title": "Monitor portfolio performance", "description": "Track returns and manage your investment portfolio", "order": 5}
    ],
    BusinessType.PAYBOND: [
        {"title": "Understand bond structure", "description": "Learn how PayBond utilizes member guarantors", "order": 1},
        {"title": "Complete guarantor application", "description": "Apply to become a bond guarantor", "order": 2},
        {"title": "Set guarantee limits", "description": "Define your maximum guarantee exposure", "order": 3},
        {"title": "Back your first bond", "description": "Provide backing for a business bond", "order": 4},
        {"title": "Receive guarantee returns", "description": "Collect returns from successful bond completions", "order": 5}
    ],
    BusinessType.H2_GREEN_PRODUCTION: [
        {"title": "Review hydrogen production plans", "description": "Understand the green hydrogen production process", "order": 1},
        {"title": "Calculate investment capacity", "description": "Determine your contribution to production facilities", "order": 2},
        {"title": "Submit participation interest", "description": "Express interest in the hydrogen production program", "order": 3},
        {"title": "Complete investment transfer", "description": "Fund your share of production infrastructure", "order": 4},
        {"title": "Track production output", "description": "Monitor hydrogen production and revenue generation", "order": 5}
    ]
}


# ============ TASK TEMPLATES (Admin) ============

@router.get("/task-templates", response_model=List[TaskTemplateResponse])
async def get_task_templates(
    business_type: Optional[BusinessType] = None,
    admin_user: User = Depends(get_admin_user)
):
    """Get all task templates, optionally filtered by business type"""
    query = {}
    if business_type:
        query["business_type"] = business_type
    templates = await db.task_templates.find(query, {"_id": 0}).sort("order", 1).to_list(1000)
    return [TaskTemplateResponse(**t) for t in templates]


@router.post("/task-templates", response_model=TaskTemplateResponse)
async def create_task_template(
    template_data: TaskTemplateCreate,
    admin_user: User = Depends(get_admin_user)
):
    """Create a new task template for a business type"""
    template = {
        "id": str(uuid.uuid4()),
        "business_type": template_data.business_type,
        "title": template_data.title,
        "description": template_data.description,
        "order": template_data.order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.task_templates.insert_one(template)
    return TaskTemplateResponse(**template)


@router.put("/task-templates/{template_id}", response_model=TaskTemplateResponse)
async def update_task_template(
    template_id: str,
    template_data: TaskTemplateUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update a task template"""
    update_data = {k: v for k, v in template_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.task_templates.update_one({"id": template_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = await db.task_templates.find_one({"id": template_id}, {"_id": 0})
    return TaskTemplateResponse(**template)


@router.delete("/task-templates/{template_id}")
async def delete_task_template(template_id: str, admin_user: User = Depends(get_admin_user)):
    """Delete a task template"""
    result = await db.task_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}


@router.post("/task-templates/initialize-defaults")
async def initialize_default_templates(admin_user: User = Depends(get_admin_user)):
    """Initialize default task templates for all business types"""
    created_count = 0
    for business_type, tasks in DEFAULT_TASKS.items():
        # Check if templates already exist for this business type
        existing = await db.task_templates.find_one({"business_type": business_type})
        if not existing:
            for task in tasks:
                template = {
                    "id": str(uuid.uuid4()),
                    "business_type": business_type,
                    "title": task["title"],
                    "description": task["description"],
                    "order": task["order"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.task_templates.insert_one(template)
                created_count += 1
    
    return {"message": f"Initialized {created_count} default task templates"}


# ============ MEMBER PROJECTS ============

@router.get("/my-projects", response_model=List[MemberProjectResponse])
async def get_my_projects(current_user: User = Depends(get_current_user)):
    """Get all projects for the current member"""
    projects = await db.member_projects.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    return [MemberProjectResponse(**p) for p in projects]


@router.post("/start/{business_type}", response_model=MemberProjectResponse)
async def start_project(business_type: BusinessType, current_user: User = Depends(get_current_user)):
    """Start a new project (activate a business from HQ)"""
    # Check if project already exists
    existing = await db.member_projects.find_one({
        "user_id": current_user.id,
        "business_type": business_type
    })
    if existing:
        raise HTTPException(status_code=400, detail="Project already started for this business")
    
    # Create the project
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "user_id": current_user.id,
        "business_type": business_type,
        "business_name": BUSINESS_NAMES.get(business_type, business_type),
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.member_projects.insert_one(project)
    
    # Get task templates for this business type
    templates = await db.task_templates.find(
        {"business_type": business_type},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    # If no custom templates, use defaults
    if not templates:
        default_tasks = DEFAULT_TASKS.get(business_type, [])
        for task in default_tasks:
            template = {
                "id": str(uuid.uuid4()),
                "business_type": business_type,
                "title": task["title"],
                "description": task["description"],
                "order": task["order"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.task_templates.insert_one(template)
            templates.append(template)
    
    # Create member tasks from templates
    for template in templates:
        member_task = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "user_id": current_user.id,
            "template_id": template["id"],
            "title": template["title"],
            "description": template["description"],
            "order": template["order"],
            "status": TaskStatus.PENDING,
            "completed_at": None
        }
        await db.member_tasks.insert_one(member_task)
    
    return MemberProjectResponse(**project)


@router.get("/{project_id}/tasks", response_model=List[MemberTaskResponse])
async def get_project_tasks(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all tasks for a specific project"""
    # Verify project belongs to user (or user is admin)
    project = await db.member_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
    
    tasks = await db.member_tasks.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    return [MemberTaskResponse(**t) for t in tasks]


@router.put("/tasks/{task_id}/status", response_model=MemberTaskResponse)
async def update_task_status(
    task_id: str,
    status_update: TaskStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a task's status"""
    task = await db.member_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_data = {"status": status_update.status}
    if status_update.status == TaskStatus.COMPLETED:
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.member_tasks.update_one({"id": task_id}, {"$set": update_data})
    
    # Check if all tasks are completed to update project status
    project_tasks = await db.member_tasks.find(
        {"project_id": task["project_id"]},
        {"_id": 0}
    ).to_list(100)
    
    all_completed = all(t["status"] == TaskStatus.COMPLETED or t["id"] == task_id and status_update.status == TaskStatus.COMPLETED for t in project_tasks)
    
    if all_completed:
        await db.member_projects.update_one(
            {"id": task["project_id"]},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    updated_task = await db.member_tasks.find_one({"id": task_id}, {"_id": 0})
    return MemberTaskResponse(**updated_task)


@router.get("/{project_id}/progress")
async def get_project_progress(project_id: str, current_user: User = Depends(get_current_user)):
    """Get progress summary for a project"""
    project = await db.member_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    tasks = await db.member_tasks.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t["status"] == TaskStatus.COMPLETED)
    in_progress_tasks = sum(1 for t in tasks if t["status"] == TaskStatus.IN_PROGRESS)
    
    progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return {
        "project_id": project_id,
        "business_name": project["business_name"],
        "status": project["status"],
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "pending_tasks": total_tasks - completed_tasks - in_progress_tasks,
        "progress_percentage": round(progress_percentage, 1)
    }


# ============ ADMIN: MEMBER PROGRESS ============

@router.get("/admin/member-progress", response_model=List[MemberProgressResponse])
async def get_all_member_progress(admin_user: User = Depends(get_admin_user)):
    """Get progress summary for all approved members"""
    from models.schemas import UserStatus
    
    members = await db.users.find(
        {"role": "member", "status": UserStatus.APPROVED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    progress_list = []
    for member in members:
        projects = await db.member_projects.find(
            {"user_id": member["id"]},
            {"_id": 0}
        ).to_list(100)
        
        total_projects = len(projects)
        active_projects = sum(1 for p in projects if p["status"] == "active")
        completed_projects = sum(1 for p in projects if p["status"] == "completed")
        
        # Calculate overall progress
        total_tasks = 0
        completed_tasks = 0
        for project in projects:
            tasks = await db.member_tasks.find(
                {"project_id": project["id"]},
                {"_id": 0}
            ).to_list(100)
            total_tasks += len(tasks)
            completed_tasks += sum(1 for t in tasks if t["status"] == TaskStatus.COMPLETED)
        
        overall_progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        progress_list.append(MemberProgressResponse(
            user_id=member["id"],
            user_name=member["name"],
            user_email=member["email"],
            tier=member.get("tier", "junior_recruit"),
            total_projects=total_projects,
            active_projects=active_projects,
            completed_projects=completed_projects,
            overall_progress=round(overall_progress, 1)
        ))
    
    return progress_list


@router.get("/admin/member/{user_id}/projects")
async def get_member_projects_detail(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Get detailed project information for a specific member"""
    member = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    projects = await db.member_projects.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    projects_with_progress = []
    for project in projects:
        tasks = await db.member_tasks.find(
            {"project_id": project["id"]},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t["status"] == TaskStatus.COMPLETED)
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        projects_with_progress.append({
            **project,
            "tasks": tasks,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "progress_percentage": round(progress_percentage, 1)
        })
    
    return {
        "member": member,
        "projects": projects_with_progress
    }


# ============ AUTO-ACTIVATE CENSORED REFERRALS ============

async def ensure_censored_referrals_active(user_id: str):
    """Ensure Censored Referrals project is active for a user"""
    existing = await db.member_projects.find_one({
        "user_id": user_id,
        "business_type": BusinessType.CENSORED_REFERRALS
    })
    
    if not existing:
        project_id = str(uuid.uuid4())
        project = {
            "id": project_id,
            "user_id": user_id,
            "business_type": BusinessType.CENSORED_REFERRALS,
            "business_name": BUSINESS_NAMES[BusinessType.CENSORED_REFERRALS],
            "status": "active",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }
        await db.member_projects.insert_one(project)
        
        # Create tasks from defaults
        default_tasks = DEFAULT_TASKS.get(BusinessType.CENSORED_REFERRALS, [])
        for task in default_tasks:
            member_task = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "user_id": user_id,
                "template_id": "",
                "title": task["title"],
                "description": task["description"],
                "order": task["order"],
                "status": TaskStatus.PENDING,
                "completed_at": None
            }
            await db.member_tasks.insert_one(member_task)
        
        return project
    return existing


@router.post("/activate-censored-referrals-all")
async def activate_censored_referrals_for_all(admin_user: User = Depends(get_admin_user)):
    """Activate Censored Referrals for all existing approved members"""
    from models.schemas import UserStatus
    
    members = await db.users.find(
        {"role": "member", "status": UserStatus.APPROVED},
        {"_id": 0}
    ).to_list(1000)
    
    activated_count = 0
    for member in members:
        result = await ensure_censored_referrals_active(member["id"])
        if result:
            activated_count += 1
    
    return {"message": f"Activated Censored Referrals for {activated_count} members"}
