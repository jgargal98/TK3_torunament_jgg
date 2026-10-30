from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.services.participant_service import ParticipantService

SessionDep = Annotated[Session, Depends(get_session)]


def get_participant_service(session: SessionDep) -> ParticipantService:
    return ParticipantService(session)


ParticipantServiceDep = Annotated[ParticipantService, Depends(get_participant_service)]
