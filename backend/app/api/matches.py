from fastapi import APIRouter

from app.dependencies import TournamentServiceDep
from app.schemas import TournamentDetail, WinnerInput

router = APIRouter(prefix="/matches", tags=["matches"])


@router.put(
    "/{match_id}/winner",
    response_model=TournamentDetail,
    summary="Register the winner of a match (advances the round when it is complete)",
)
def set_winner(match_id: int, data: WinnerInput, service: TournamentServiceDep):
    return service.set_winner(match_id, data.winner_id)
