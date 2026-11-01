
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PlanGenerationRequest(BaseModel):
    project_title: str = Field(min_length=2, max_length=200)
    project_brief: str = Field(min_length=20, max_length=20000)
    target_date: Optional[date] = None


class PlannedMilestone(BaseModel):
    ref: str
    title: str
    description: str = ""
    due_date: Optional[date] = None


class PlannedTask(BaseModel):
    ref: str
    milestone_ref: Optional[str] = None
    title: str
    description: str = ""
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    estimated_hours: Optional[float] = Field(default=None, ge=0)
    due_date: Optional[date] = None


class PlannedDependency(BaseModel):
    predecessor_ref: str
    successor_ref: str
    description: str = ""


class ProjectPlanResponse(BaseModel):
    summary: str
    milestones: list[PlannedMilestone]
    tasks: list[PlannedTask]
    dependencies: list[PlannedDependency]
    risks: list[str]
    unresolved_questions: list[str]
