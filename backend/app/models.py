"""ORM models: how the data is stored in MariaDB."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# utf8mb4 is required to store emoji logos.
MYSQL_TABLE_ARGS = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"}


class TournamentStatus:
    PREPARATION = "PREPARACION"
    BRACKET_GENERATED = "GENERADO"


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = MYSQL_TABLE_ARGS

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nick: Mapped[str] = mapped_column(String(40), unique=True)
    logo: Mapped[str] = mapped_column(String(16))
    # Deactivating is the usual action instead of deleting: the history is kept.
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


tournament_participants = Table(
    "tournament_participants",
    Base.metadata,
    Column(
        "tournament_id",
        ForeignKey("tournaments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("participant_id", ForeignKey("participants.id"), primary_key=True),
    **MYSQL_TABLE_ARGS,
)


class Tournament(Base):
    __tablename__ = "tournaments"
    __table_args__ = MYSQL_TABLE_ARGS

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20), default=TournamentStatus.PREPARATION)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    bracket_generated_at: Mapped[datetime | None] = mapped_column(DateTime)

    participants: Mapped[list[Participant]] = relationship(
        secondary=tournament_participants, order_by=Participant.nick
    )
    matches: Mapped[list["Match"]] = relationship(
        back_populates="tournament",
        order_by="[Match.round, Match.position]",
        cascade="all, delete-orphan",
    )


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        UniqueConstraint("tournament_id", "round", "position"),
        MYSQL_TABLE_ARGS,
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"))
    round: Mapped[int] = mapped_column(Integer)
    # Order inside the round: matches 2k and 2k+1 feed match k of the next round.
    position: Mapped[int] = mapped_column(Integer)
    participant1_id: Mapped[int | None] = mapped_column(ForeignKey("participants.id"))
    # Empty when the match is a BYE: participant1 goes through automatically.
    participant2_id: Mapped[int | None] = mapped_column(ForeignKey("participants.id"))
    winner_id: Mapped[int | None] = mapped_column(ForeignKey("participants.id"))
    is_bye: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)

    tournament: Mapped[Tournament] = relationship(back_populates="matches")
    participant1: Mapped[Participant | None] = relationship(foreign_keys=[participant1_id])
    participant2: Mapped[Participant | None] = relationship(foreign_keys=[participant2_id])
    winner: Mapped[Participant | None] = relationship(foreign_keys=[winner_id])
