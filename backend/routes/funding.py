from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4

from models.schemas import (
    User, UserRole, FundingStatus, FundingStatusUpdate,
    ClusterMemberValue, ClusterMemberValueUpdate
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/funding", tags=["funding-progress"])


# ============ FUNDING PROGRESS ============

@router.get("/progress/summary")
async def get_funding_summary(admin_user: User = Depends(get_admin_user)):
    """Get summary of funding progress for all members"""
    from models.schemas import UserStatus
    
    # Get all approved members
    members = await db.users.find(
        {"role": "member", "status": UserStatus.APPROVED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    # Get funding statuses
    funding_records = await db.funding_status.find({}, {"_id": 0}).to_list(1000)
    funding_map = {f["user_id"]: f for f in funding_records}
    
    total_members = len(members)
    registered_count = sum(1 for m in members if funding_map.get(m["id"], {}).get("business_registered", False))
    funded_count = sum(1 for m in members if funding_map.get(m["id"], {}).get("business_funded", False))
    
    return {
        "total_members": total_members,
        "registered_count": registered_count,
        "funded_count": funded_count
    }


@router.get("/progress/members")
async def get_all_members_funding(admin_user: User = Depends(get_admin_user)):
    """Get funding status for all approved members"""
    from models.schemas import UserStatus
    
    # Get all approved members
    members = await db.users.find(
        {"role": "member", "status": UserStatus.APPROVED},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    # Get funding statuses
    funding_records = await db.funding_status.find({}, {"_id": 0}).to_list(1000)
    funding_map = {f["user_id"]: f for f in funding_records}
    
    result = []
    for member in members:
        funding = funding_map.get(member["id"], {})
        result.append({
            "user_id": member["id"],
            "user_name": member["name"],
            "user_email": member["email"],
            "tier": member.get("tier", "junior_recruit"),
            "business_registered": funding.get("business_registered", False),
            "business_funded": funding.get("business_funded", False),
            "registered_at": funding.get("registered_at"),
            "funded_at": funding.get("funded_at")
        })
    
    return result


@router.put("/progress/{user_id}")
async def update_member_funding(
    user_id: str,
    update: FundingStatusUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update funding status for a member"""
    # Verify member exists
    member = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Get or create funding record
    existing = await db.funding_status.find_one({"user_id": user_id})
    
    update_data = {}
    if update.business_registered is not None:
        update_data["business_registered"] = update.business_registered
        if update.business_registered:
            update_data["registered_at"] = datetime.now(timezone.utc).isoformat()
            update_data["registered_by"] = admin_user.id
    
    if update.business_funded is not None:
        update_data["business_funded"] = update.business_funded
        if update.business_funded:
            update_data["funded_at"] = datetime.now(timezone.utc).isoformat()
            update_data["funded_by"] = admin_user.id
    
    if existing:
        await db.funding_status.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        await db.funding_status.insert_one({
            "id": str(uuid4()),
            "user_id": user_id,
            "user_name": member["name"],
            "user_email": member["email"],
            "business_registered": update.business_registered or False,
            "business_funded": update.business_funded or False,
            **update_data
        })
    
    return {"message": "Funding status updated"}


# ============ CLUSTER SYNDICATE VALUES ============

@router.get("/cluster/summary")
async def get_cluster_summary(current_user: User = Depends(get_current_user)):
    """Get summary of all clusters with member counts and capital"""
    from models.schemas import BusinessType, UserStatus
    
    # Get all active projects grouped by business type
    projects = await db.member_projects.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(10000)
    
    # Count members per business type
    cluster_counts = {}
    for project in projects:
        bt = project["business_type"]
        if bt not in cluster_counts:
            cluster_counts[bt] = set()
        cluster_counts[bt].add(project["user_id"])
    
    # Get cluster values (admin-entered)
    values = await db.cluster_values.find({}, {"_id": 0}).to_list(10000)
    value_map = {}  # {business_type: {user_id: value}}
    for v in values:
        bt = v["business_type"]
        if bt not in value_map:
            value_map[bt] = {}
        value_map[bt][v["user_id"]] = v["value"]
    
    # Calculate totals per cluster
    clusters = []
    total_capital = 0
    
    business_names = {
        "censored_referrals": "Censored Referrals",
        "guaranteed_flips": "Guaranteed Flips",
        "solarhex": "SolarHex",
        "iceberg_technologies": "Iceberg Technologies",
        "cpod": "CPOD",
        "payload_fintech": "Payload Fintech",
        "paybond": "PayBond",
        "h2_green_production": "H2 Green Production"
    }
    
    for bt, user_ids in cluster_counts.items():
        member_count = len(user_ids)
        bt_values = value_map.get(bt, {})
        cluster_capital = sum(bt_values.values())
        total_capital += cluster_capital
        
        clusters.append({
            "business_type": bt,
            "business_name": business_names.get(bt, bt),
            "member_count": member_count,
            "capital": cluster_capital
        })
    
    return {
        "clusters": sorted(clusters, key=lambda x: x["member_count"], reverse=True),
        "total_capital": total_capital
    }


@router.get("/cluster/{business_type}/members")
async def get_cluster_members(
    business_type: str,
    admin_user: User = Depends(get_admin_user)
):
    """Get all members in a cluster with their values"""
    # Get all users with this project active
    projects = await db.member_projects.find(
        {"business_type": business_type, "status": "active"},
        {"_id": 0}
    ).to_list(1000)
    
    user_ids = [p["user_id"] for p in projects]
    
    # Get user details
    members = await db.users.find(
        {"id": {"$in": user_ids}},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    # Get cluster values
    values = await db.cluster_values.find(
        {"business_type": business_type},
        {"_id": 0}
    ).to_list(1000)
    value_map = {v["user_id"]: v["value"] for v in values}
    
    result = []
    for member in members:
        result.append({
            "user_id": member["id"],
            "user_name": member["name"],
            "user_email": member["email"],
            "tier": member.get("tier", "junior_recruit"),
            "value": value_map.get(member["id"], 0)
        })
    
    return result


@router.put("/cluster/{business_type}/member/{user_id}/value")
async def update_member_cluster_value(
    business_type: str,
    user_id: str,
    update: ClusterMemberValueUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update a member's value in a cluster"""
    # Verify member has this project active
    project = await db.member_projects.find_one({
        "user_id": user_id,
        "business_type": business_type,
        "status": "active"
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Member not in this cluster")
    
    # Get member info
    member = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Update or create value record
    existing = await db.cluster_values.find_one({
        "user_id": user_id,
        "business_type": business_type
    })
    
    if existing:
        await db.cluster_values.update_one(
            {"user_id": user_id, "business_type": business_type},
            {"$set": {
                "value": update.value,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": admin_user.id
            }}
        )
    else:
        await db.cluster_values.insert_one({
            "id": str(uuid4()),
            "user_id": user_id,
            "user_name": member["name"],
            "business_type": business_type,
            "value": update.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin_user.id
        })
    
    return {"message": "Value updated"}


@router.get("/bank/total")
async def get_bank_total(current_user: User = Depends(get_current_user)):
    """Get total bank value (sum of all cluster values)"""
    values = await db.cluster_values.find({}, {"_id": 0, "value": 1}).to_list(10000)
    total = sum(v.get("value", 0) for v in values)
    return {"total": total}
