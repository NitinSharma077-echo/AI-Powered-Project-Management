
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PlanGenerationRequest(BaseModel):
    project_title: str = Field(min_length=2, max_length=200)
    # Documents can be longer than a typed brief; the API caps each mode.
    project_brief: str = Field(min_length=20, max_length=60000)
    target_date: Optional[date] = None
    # "brief": plan from a description. "document": extract the items an
    # uploaded document already lists, keeping its own structure.
    source: Literal["brief", "document"] = "brief"
    document_name: Optional[str] = Field(default=None, max_length=255)


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
