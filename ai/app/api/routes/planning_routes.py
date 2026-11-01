
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_service_token

from app.schemas.planning import (
    PlanGenerationRequest,
    ProjectPlanResponse,
)
from app.services.planning_service import generate_project_plan


router = APIRouter(prefix="/api/v1/plans", tags=["Project Planning"])


@router.post(
    "/generate",
    response_model=ProjectPlanResponse,
    dependencies=[Depends(verify_service_token)]
)
async def generate_plan(request: PlanGenerationRequest):

    try:
        return await generate_project_plan(request)

    except RuntimeError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc)
        ) from exc
