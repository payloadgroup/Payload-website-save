from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User,
    ResourceCreate, ResourceResponse
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(prefix="/basecamp", tags=["basecamp"])

@router.get("", response_model=List[ResourceResponse])
async def get_resources(current_user: User = Depends(get_current_user)):
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    return [ResourceResponse(**r) for r in resources]

@router.post("", response_model=ResourceResponse)
async def create_resource(resource_data: ResourceCreate, admin_user: User = Depends(get_admin_user)):
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
