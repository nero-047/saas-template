from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["service-status"])


class HealthResponse(BaseModel):
    status: Literal["healthy"] = "healthy"


class ReadinessResponse(BaseModel):
    status: Literal["ready"] = "ready"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.get("/ready", response_model=ReadinessResponse)
async def ready() -> ReadinessResponse:
    return ReadinessResponse()
