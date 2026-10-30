from sqlalchemy.orm import Session

from app.models import Participant
from app.repositories import ParticipantRepository
from app.schemas import ParticipantInput
from app.services.errors import NotFoundError, RuleError


class ParticipantService:
    """Participants are never deleted: deactivating keeps their history and statistics."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = ParticipantRepository(session)

    def list_all(self, active: bool | None = None) -> list[Participant]:
        return self.repository.list_all(active)

    def get(self, participant_id: int) -> Participant:
        participant = self.repository.get(participant_id)
        if participant is None:
            raise NotFoundError(f"No existe el participante {participant_id}")
        return participant

    def create(self, data: ParticipantInput) -> Participant:
        self._ensure_unique_nick(data.nick)
        participant = self.repository.add(Participant(nick=data.nick, logo=data.logo, active=True))
        self.session.commit()
        return participant

    def update(self, participant_id: int, data: ParticipantInput) -> Participant:
        participant = self.get(participant_id)
        self._ensure_unique_nick(data.nick, exclude_id=participant_id)
        participant.nick = data.nick
        participant.logo = data.logo
        self.session.commit()
        return participant

    def set_active(self, participant_id: int, active: bool) -> Participant:
        participant = self.get(participant_id)
        participant.active = active
        self.session.commit()
        return participant

    def _ensure_unique_nick(self, nick: str, exclude_id: int | None = None) -> None:
        existing = self.repository.find_by_nick(nick)
        if existing is not None and existing.id != exclude_id:
            raise RuleError(f"Ya existe un participante con el nick «{nick}»", 409)
