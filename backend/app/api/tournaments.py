from fastapi import APIRouter, Response, status

from app.dependencies import TournamentServiceDep
from app.schemas import TournamentDetail, TournamentInput, TournamentSummary

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


@router.get("", response_model=list[TournamentSummary], summary="List tournaments")
def list_tournaments(service: TournamentServiceDep):
    return service.list_all()


@router.get(
    "/{tournament_id}",
    response_model=TournamentDetail,
    summary="Tournament with participants and bracket",
)
def get_tournament(tournament_id: int, service: TournamentServiceDep):
    return service.detail(tournament_id)


@router.post(
    "",
    response_model=TournamentDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tournament in preparation",
)
def create_tournament(data: TournamentInput, service: TournamentServiceDep):
    return service.create(data)


@router.put(
    "/{tournament_id}",
    response_model=TournamentDetail,
    summary="Edit a tournament that is still in preparation",
)
def update_tournament(tournament_id: int, data: TournamentInput, service: TournamentServiceDep):
    return service.update(tournament_id, data)


@router.delete(
    "/{tournament_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a tournament that is still in preparation",
)
def delete_tournament(tournament_id: int, service: TournamentServiceDep):
    service.delete(tournament_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{tournament_id}/bracket",
    response_model=TournamentDetail,
    summary="Random draw of the KO bracket (first round)",
)
def generate_bracket(tournament_id: int, service: TournamentServiceDep):
    return service.generate_bracket(tournament_id)
