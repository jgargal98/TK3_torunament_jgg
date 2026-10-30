"""Tournament rules: participant selection and the random KO bracket with BYEs."""

import random
from datetime import datetime

from sqlalchemy.orm import Session

from app import schemas
from app.models import Match, Participant, Tournament, TournamentStatus
from app.repositories import ParticipantRepository, TournamentRepository
from app.services.errors import NotFoundError, RuleError


def bracket_size(participant_count: int) -> int:
    """Smallest power of two that fits every participant (6 players -> 8 slots)."""
    return 1 << (participant_count - 1).bit_length() if participant_count >= 2 else 0


def total_rounds(participant_count: int) -> int:
    return (participant_count - 1).bit_length() if participant_count >= 2 else 0


def bye_positions(slots: int, byes: int) -> set[int]:
    """First-round matches that get a BYE, spread along the bracket so they do not all
    fall on the same side (8 slots, 2 BYEs -> matches 0 and 2: one in each half)."""
    return {(index * slots) // byes for index in range(byes)} if byes else set()


class TournamentService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = TournamentRepository(session)
        self.participants = ParticipantRepository(session)

    # ---------- Queries ----------

    def list_all(self) -> list[schemas.TournamentSummary]:
        return [self.to_summary(tournament) for tournament in self.repository.list_all()]

    def get(self, tournament_id: int) -> Tournament:
        tournament = self.repository.get(tournament_id)
        if tournament is None:
            raise NotFoundError(f"No existe el torneo {tournament_id}")
        return tournament

    def detail(self, tournament_id: int) -> schemas.TournamentDetail:
        return self.to_detail(self.get(tournament_id))

    # ---------- Preparation ----------

    def create(self, data: schemas.TournamentInput) -> schemas.TournamentDetail:
        tournament = Tournament(name=data.name, status=TournamentStatus.PREPARATION)
        tournament.participants = self._select_participants(data.participant_ids)
        self.repository.add(tournament)
        self.session.commit()
        return self.to_detail(tournament)

    def update(self, tournament_id: int, data: schemas.TournamentInput) -> schemas.TournamentDetail:
        tournament = self.get(tournament_id)
        self._ensure_preparation(tournament, "editar")
        tournament.name = data.name
        tournament.participants = self._select_participants(data.participant_ids)
        self.session.commit()
        return self.to_detail(tournament)

    def delete(self, tournament_id: int) -> None:
        tournament = self.get(tournament_id)
        self._ensure_preparation(tournament, "eliminar")
        self.repository.delete(tournament)
        self.session.commit()

    def _select_participants(self, participant_ids: list[int]) -> list[Participant]:
        unique_ids = set(participant_ids)
        if len(unique_ids) != len(participant_ids):
            raise RuleError("Un participante no puede aparecer dos veces en el torneo")
        if len(unique_ids) < 2:
            raise RuleError("Un torneo necesita al menos dos participantes")

        selected = self.participants.get_many(list(unique_ids))
        missing = unique_ids - {participant.id for participant in selected}
        if missing:
            raise NotFoundError(f"No existen los participantes {sorted(missing)}")
        inactive = [participant.nick for participant in selected if not participant.active]
        if inactive:
            raise RuleError(f"Solo se pueden inscribir participantes activos: {', '.join(inactive)}")
        return selected

    # ---------- Bracket ----------

    def generate_bracket(self, tournament_id: int) -> schemas.TournamentDetail:
        """Random draw of the first round. Empty slots become BYEs: that player goes
        straight to the next round."""
        tournament = self.get(tournament_id)
        self._ensure_preparation(tournament, "generar el cuadro de")

        players = list(tournament.participants)
        if len(players) < 2:
            raise RuleError("Un torneo necesita al menos dos participantes")
        inactive = [player.nick for player in players if not player.active]
        if inactive:
            raise RuleError(
                f"Hay participantes desactivados en el torneo: {', '.join(inactive)}. "
                "Edítalo o vuelve a activarlos antes del sorteo."
            )

        random.shuffle(players)
        slots = bracket_size(len(players)) // 2
        byes = bye_positions(slots, bracket_size(len(players)) - len(players))
        now = datetime.now()
        queue = iter(players)

        for position in range(slots):
            if position in byes:
                player = next(queue)
                match = Match(
                    round=1,
                    position=position,
                    participant1=player,
                    winner=player,
                    is_bye=True,
                    resolved_at=now,
                )
            else:
                match = Match(
                    round=1,
                    position=position,
                    participant1=next(queue),
                    participant2=next(queue),
                )
            tournament.matches.append(match)

        tournament.status = TournamentStatus.BRACKET_GENERATED
        tournament.bracket_generated_at = now
        self.session.commit()
        return self.to_detail(tournament)

    @staticmethod
    def _ensure_preparation(tournament: Tournament, action: str) -> None:
        if tournament.status != TournamentStatus.PREPARATION:
            raise RuleError(
                f"No se puede {action} un torneo con el cuadro ya generado",
                409,
            )

    # ---------- Mapping to API schemas ----------

    def to_summary(self, tournament: Tournament) -> schemas.TournamentSummary:
        return schemas.TournamentSummary(**self._summary_fields(tournament))

    def to_detail(self, tournament: Tournament) -> schemas.TournamentDetail:
        return schemas.TournamentDetail(
            **self._summary_fields(tournament),
            participants=[_summary(participant) for participant in tournament.participants],
            matches=[_match(match) for match in tournament.matches],
        )

    @staticmethod
    def _summary_fields(tournament: Tournament) -> dict:
        count = len(tournament.participants)
        return {
            "id": tournament.id,
            "name": tournament.name,
            "status": tournament.status,
            "created_at": tournament.created_at,
            "bracket_generated_at": tournament.bracket_generated_at,
            "participant_count": count,
            "total_rounds": total_rounds(count),
            "bye_count": bracket_size(count) - count,
            "logos": [participant.logo for participant in tournament.participants],
        }


def _summary(participant: Participant | None) -> schemas.ParticipantSummary | None:
    return schemas.ParticipantSummary.model_validate(participant) if participant else None


def _match(match: Match) -> schemas.Match:
    return schemas.Match(
        id=match.id,
        round=match.round,
        position=match.position,
        participant1=_summary(match.participant1),
        participant2=_summary(match.participant2),
        winner_id=match.winner_id,
        is_bye=match.is_bye,
    )
