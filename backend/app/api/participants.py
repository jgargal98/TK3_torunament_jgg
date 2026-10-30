from fastapi import APIRouter, status

from app.dependencies import ParticipantServiceDep
from app.schemas import Participant, ParticipantActiveInput, ParticipantInput

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("", response_model=list[Participant], summary="List participants")
def list_participants(service: ParticipantServiceDep, active: bool | None = None):
    return service.list_all(active)


@router.get("/{participant_id}", response_model=Participant, summary="Get a participant")
def get_participant(participant_id: int, service: ParticipantServiceDep):
    return service.get(participant_id)


@router.post(
    "",
    response_model=Participant,
    status_code=status.HTTP_201_CREATED,
    summary="Create a participant",
)
def create_participant(data: ParticipantInput, service: ParticipantServiceDep):
    return service.create(data)


@router.put("/{participant_id}", response_model=Participant, summary="Edit nick and logo")
def update_participant(participant_id: int, data: ParticipantInput, service: ParticipantServiceDep):
    return service.update(participant_id, data)


@router.patch(
    "/{participant_id}/active",
    response_model=Participant,
    summary="Activate or deactivate a participant",
)
def set_participant_active(
    participant_id: int, data: ParticipantActiveInput, service: ParticipantServiceDep
):
    return service.set_active(participant_id, data.active)
