
import os

import httpx

from app.schemas.planning import (
    PlanGenerationRequest,
    ProjectPlanResponse,
)


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

OPENAI_BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "https://api.openai.com/v1"
).rstrip("/")

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-4o-mini"
)

OPENAI_TIMEOUT = float(
    os.getenv("OPENAI_TIMEOUT", "180")
)


async def generate_project_plan(
    request: PlanGenerationRequest,
) -> ProjectPlanResponse:

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured.")

    target_date = (
        request.target_date.isoformat()
        if request.target_date
        else "Not specified"
    )

    prompt = f"""
You are an experienced project planning assistant.

Create a realistic and actionable project plan.

PROJECT TITLE:
{request.project_title}

PROJECT BRIEF:
{request.project_brief}

TARGET DATE:
{target_date}

RULES:
1. Break the project into meaningful milestones.
2. Break milestones into specific, actionable tasks.
3. Use unique milestone references: M1, M2, M3.
4. Use unique task references: T1, T2, T3.
5. Use milestone_ref to connect a task to a milestone.
6. Create dependencies only when one task genuinely requires
   another task to finish first.
7. Never create circular dependencies.
8. Do not invent people or assignees.
9. Use realistic estimated hours.
10. Use ISO dates YYYY-MM-DD or null.
11. Do not invent a target date if none is provided.
12. Include risks and unresolved questions.
13. Return only valid JSON matching the requested schema.

If the brief does not contain enough information for a date,
use null rather than guessing.
"""

    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Return structured project planning data as a single "
                    "JSON object that matches exactly this JSON schema:\n"
                    f"{ProjectPlanResponse.model_json_schema()}"
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }

    try:
        async with httpx.AsyncClient(
            timeout=OPENAI_TIMEOUT
        ) as client:

            response = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}"
                }
            )

            response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        return ProjectPlanResponse.model_validate_json(content)

    except httpx.TimeoutException as exc:
        raise RuntimeError(
            "AI planning timed out. Try a shorter project brief."
        ) from exc

    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"OpenAI returned HTTP {exc.response.status_code}."
        ) from exc

    except httpx.HTTPError as exc:
        raise RuntimeError(
            "Could not connect to OpenAI. Check your network connection."
        ) from exc

    except (KeyError, ValueError) as exc:
        raise RuntimeError(
            "AI returned an invalid project plan. Please try again."
        ) from exc
