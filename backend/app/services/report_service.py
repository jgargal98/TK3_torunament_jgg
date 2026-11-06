"""Reports computed from the stored results. A BYE is not a match: it counts neither
as a win nor as a played match."""

from collections import Counter

from sqlalchemy.orm import Session

from app import schemas
from app.models import Match, Participant
from app.repositories import ParticipantRepository, TournamentRepository
from app.services.errors import NotFoundError
from app.services.tournament_service import round_name, total_rounds


class ReportService:
    def __init__(self, session: Session) -> None:
        self.participants = ParticipantRepository(session)
        self.tournaments = TournamentRepository(session)

    def participant_stats(self) -> list[schemas.ParticipantStats]:
        """Every participant (inactive ones keep their statistics), best record first."""
        wins: Counter[int] = Counter()
        losses: Counter[int] = Counter()
        for match in self.tournaments.played_matches():
            wins[match.winner_id] += 1
            losses[_loser(match).id] += 1

        titles = Counter(
            tournament.champion_id
            for tournament in self.tournaments.list_all()
            if tournament.champion_id is not None
        )

        stats = []
        for participant in self.participants.list_all():
            played = wins[participant.id] + losses[participant.id]
            stats.append(
                schemas.ParticipantStats(
                    participant=schemas.ParticipantSummary.model_validate(participant),
                    matches_played=played,
                    wins=wins[participant.id],
                    losses=losses[participant.id],
                    win_rate=round(wins[participant.id] / played * 100, 1) if played else 0,
                    tournaments_won=titles[participant.id],
                )
            )
        stats.sort(key=lambda item: (-item.wins, item.losses, item.participant.nick.lower()))
        return stats

    def stats_of_participant(self, participant_id: int) -> schemas.ParticipantStats:
        for item in self.participant_stats():
            if item.participant.id == participant_id:
                return item
        raise NotFoundError(f"No existe el participante {participant_id}")

    def tournament_history(self, tournament_id: int) -> list[schemas.MatchHistoryItem]:
        """Matches already played in a tournament, round by round."""
        tournament = self.tournaments.get(tournament_id)
        if tournament is None:
            raise NotFoundError(f"No existe el torneo {tournament_id}")

        rounds = total_rounds(len(tournament.participants))
        played = [m for m in tournament.matches if m.winner_id is not None and not m.is_bye]
        played.sort(key=lambda match: (match.round, match.resolved_at, match.position))
        return [
            schemas.MatchHistoryItem(
                id=match.id,
                round=match.round,
                round_name=round_name(match.round, rounds),
                winner=schemas.ParticipantSummary.model_validate(match.winner),
                loser=schemas.ParticipantSummary.model_validate(_loser(match)),
                resolved_at=match.resolved_at,
            )
            for match in played
        ]


def _loser(match: Match) -> Participant:
    return match.participant2 if match.winner_id == match.participant1_id else match.participant1
