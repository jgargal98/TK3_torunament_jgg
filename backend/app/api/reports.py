from fastapi import APIRouter

from app.dependencies import ReportServiceDep
from app.schemas import MatchHistoryItem, ParticipantStats

router = APIRouter(tags=["reports"])


@router.get(
    "/stats/participants",
    response_model=list[ParticipantStats],
    summary="Wins and losses per participant",
)
def participant_stats(service: ReportServiceDep):
    return service.participant_stats()


@router.get(
    "/tournaments/{tournament_id}/history",
    response_model=list[MatchHistoryItem],
    summary="Matches played in a tournament",
)
def tournament_history(tournament_id: int, service: ReportServiceDep):
    return service.tournament_history(tournament_id)
