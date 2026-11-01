from typing import Optional
from pydantic import BaseModel, Field


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


# One extracted decision.
class DecisionOutput(BaseModel):
    title: str

    description: str

    evidence: str

    confidence: float = Field(default=1.0, ge=0, le=1)


# One extracted action item.
class ActionItemOutput(BaseModel):
    title: str

    description: Optional[str] = None

    assignee_name: Optional[str] = None

    due_date: Optional[str] = None

    priority: str = "medium"

    evidence: str

    confidence: float = Field(default=1.0, ge=0, le=1)


# Complete AI analysis result.
class MeetingAnalysisResponse(BaseModel):
    summary: str

    key_points: list[str] = Field(default_factory=list)

    decisions: list[DecisionOutput] = Field(default_factory=list)

    action_items: list[ActionItemOutput] = Field(default_factory=list)

    unresolved_questions: list[str] = Field(default_factory=list)