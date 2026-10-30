"""Data access: the only layer that queries MariaDB through SQLAlchemy."""

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Participant, Tournament


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

    def get_many(self, participant_ids: list[int]) -> list[Participant]:
        query = select(Participant).where(Participant.id.in_(participant_ids))
        return list(self.session.scalars(query))

    def find_by_nick(self, nick: str) -> Participant | None:
        return self.session.scalar(select(Participant).where(Participant.nick == nick))

    def add(self, participant: Participant) -> Participant:
        self.session.add(participant)
        self.session.flush()
        return participant


class TournamentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Tournament]:
        query = (
            select(Tournament)
            .options(selectinload(Tournament.participants))
            .order_by(Tournament.created_at.desc(), Tournament.id.desc())
        )
        return list(self.session.scalars(query))

    def get(self, tournament_id: int) -> Tournament | None:
        return self.session.get(Tournament, tournament_id)

    def add(self, tournament: Tournament) -> Tournament:
        self.session.add(tournament)
        self.session.flush()
        return tournament

    def delete(self, tournament: Tournament) -> None:
        self.session.delete(tournament)
