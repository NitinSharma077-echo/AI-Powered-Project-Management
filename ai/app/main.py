import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from app.api.routes import router

app = FastAPI(title="AI Application", version="1.0.0")

app.include_router(router)


@app.get("/health")
async def health_check():
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    openai_base_url = os.getenv(
        "OPENAI_BASE_URL",
        "https://api.openai.com/v1"
    ).rstrip("/")

    if not openai_api_key:
        return {
            "success": False,
            "message": "OPENAI_API_KEY is not configured"
        }

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f"{openai_base_url}/models/{openai_model}",
                headers={
                    "Authorization": f"Bearer {openai_api_key}"
                }
            )
            response.raise_for_status()

        return {
            "success": True,
            "message": "AI service is healthy"
        }

    except httpx.HTTPError as error:
        return {
            "success": False,
            "message": f"AI service is unreachable: {error}"
        }
