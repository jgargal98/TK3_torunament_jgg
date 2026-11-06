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
    "/participants/{participant_id}/stats",
    response_model=ParticipantStats,
    summary="Wins and losses of one participant",
)
def stats_of_participant(participant_id: int, service: ReportServiceDep):
    return service.stats_of_participant(participant_id)


@router.get(
    "/tournaments/{tournament_id}/history",
    response_model=list[MatchHistoryItem],
    summary="Matches played in a tournament",
)
def tournament_history(tournament_id: int, service: ReportServiceDep):
    return service.tournament_history(tournament_id)
