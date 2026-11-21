from typing import Optional

from pydantic import BaseModel, Field, field_validator

PRIORITIES = {"low", "medium", "high", "urgent"}


def clamp_confidence(value) -> float:
    """Accept 0-1 or 0-100 (models sometimes return percentages)."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 1.0
    if number > 1:
        number = number / 100
    return min(max(number, 0.0), 1.0)


# Input received by the AI service.
class MeetingAnalysisRequest(BaseModel):
    meeting_id: str

    title: str = Field(min_length=1, max_length=200)

    transcript: str = Field(
        min_length=20,
        max_length=100000
    )

    meeting_date: Optional[str] = None

    participants: list[str] = Field(default_factory=list)


# One extracted decision. Defaults keep a single missing field from
# failing the whole analysis.
class DecisionOutput(BaseModel):
    title: str

    description: str = ""

    evidence: str = ""

    confidence: float = 1.0

    @field_validator("description", "evidence", mode="before")
    @classmethod
    def none_to_empty(cls, value):
        return value or ""

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, value):
        return clamp_confidence(value)


# One extracted action item.
class ActionItemOutput(BaseModel):
    title: str

    description: Optional[str] = None

    assignee_name: Optional[str] = None

    due_date: Optional[str] = None

    priority: str = "medium"

    evidence: str = ""

    confidence: float = 1.0

    @field_validator("evidence", mode="before")
    @classmethod
    def none_to_empty(cls, value):
        return value or ""

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, value):
        value = str(value or "medium").strip().lower()
        return value if value in PRIORITIES else "medium"

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, value):
        return clamp_confidence(value)


# Complete AI analysis result.
class MeetingAnalysisResponse(BaseModel):
    summary: str

    key_points: list[str] = Field(default_factory=list)

    decisions: list[DecisionOutput] = Field(default_factory=list)

    action_items: list[ActionItemOutput] = Field(default_factory=list)

    unresolved_questions: list[str] = Field(default_factory=list)
