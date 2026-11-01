import os
import secrets

from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()


async def verify_service_token(
    x_ai_service_token: str | None = Header(default=None)
):
    expected_token = os.getenv("AI_SERVICE_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service authentication is not configured."
        )

    if not x_ai_service_token or not secrets.compare_digest(
        x_ai_service_token,
        expected_token
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token."
        )