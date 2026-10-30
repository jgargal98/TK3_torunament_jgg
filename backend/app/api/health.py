from fastapi import APIRouter
from sqlalchemy import text

from app.dependencies import SessionDep
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Check API and database")
def health(session: SessionDep):
    session.execute(text("SELECT 1"))
    return HealthResponse(status="ok", database="ok")
