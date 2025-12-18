from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Add backend to path for imports
sys.path.insert(0, str(ROOT_DIR))

from utils.database import db, client
from utils.auth import hash_password
from models.schemas import UserRole, UserStatus
from datetime import datetime, timezone

# Import routers
from routes import auth, users, admin, dashboard, payloads, missions, bank, headquarters, stations, basecamp

app = FastAPI()

# Create API router and include all sub-routers
from fastapi import APIRouter
api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(dashboard.router)
api_router.include_router(payloads.router)
api_router.include_router(missions.router)
api_router.include_router(bank.router)
api_router.include_router(headquarters.router)
api_router.include_router(stations.router)
api_router.include_router(basecamp.router)

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
