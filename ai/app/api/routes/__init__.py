from fastapi import APIRouter

from app.api.routes.meeting import router as meeting_router
from app.api.routes.planning_routes import router as planning_router

router = APIRouter()
router.include_router(meeting_router, prefix="/meeting", tags=["meeting"])
router.include_router(planning_router, tags=["Project Planning"])
