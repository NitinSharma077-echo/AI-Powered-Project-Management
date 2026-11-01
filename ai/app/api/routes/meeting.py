from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_service_token

from app.schemas.meeting import (
    MeetingAnalysisRequest,
    MeetingAnalysisResponse
)

from app.services.meeting_service import (
    analyze_meeting,
    AIServiceError
)

router = APIRouter()


@router.get("/health")
async def meeting_health():
    return {
        "success": True,
        "message": "Meeting AI routes are working"
    }


@router.post(
    "/analyze",
    response_model=MeetingAnalysisResponse,
    dependencies=[Depends(verify_service_token)]
)
async def analyze_meeting_route(
    request: MeetingAnalysisRequest
):

    try:
        result = await analyze_meeting(request)

        return result

    except AIServiceError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error)
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Unexpected meeting analysis error"
        ) from error