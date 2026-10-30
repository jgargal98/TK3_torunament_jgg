from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.services.participant_service import ParticipantService
from app.services.tournament_service import TournamentService

SessionDep = Annotated[Session, Depends(get_session)]


def get_participant_service(session: SessionDep) -> ParticipantService:
    return ParticipantService(session)


def get_tournament_service(session: SessionDep) -> TournamentService:
    return TournamentService(session)


ParticipantServiceDep = Annotated[ParticipantService, Depends(get_participant_service)]
TournamentServiceDep = Annotated[TournamentService, Depends(get_tournament_service)]
