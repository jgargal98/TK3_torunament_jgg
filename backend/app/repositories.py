"""Data access: the only layer that queries MariaDB through SQLAlchemy."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Participant


class ParticipantRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self, active: bool | None = None) -> list[Participant]:
        query = select(Participant).order_by(Participant.nick)
        if active is not None:
            query = query.where(Participant.active == active)
        return list(self.session.scalars(query))

    def get(self, participant_id: int) -> Participant | None:
        return self.session.get(Participant, participant_id)

    def find_by_nick(self, nick: str) -> Participant | None:
        return self.session.scalar(select(Participant).where(Participant.nick == nick))

    def add(self, participant: Participant) -> Participant:
        self.session.add(participant)
        self.session.flush()
        return participant
