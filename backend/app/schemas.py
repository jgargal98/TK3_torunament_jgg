"""Pydantic schemas: the JSON contract between the Angular frontend and the API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ParticipantInput(BaseModel):
    nick: str = Field(min_length=2, max_length=40)
    logo: str = Field(min_length=1, max_length=16)

    @field_validator("nick", "logo")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede estar vacío")
        return value

    @field_validator("nick")
    @classmethod
    def nick_length(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("El nick debe tener al menos 2 caracteres")
        return value


class ParticipantActiveInput(BaseModel):
    active: bool


class Participant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nick: str
    logo: str
    active: bool
    created_at: datetime


class ParticipantSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nick: str
    logo: str
    active: bool


# ---------- Tournaments ----------


class TournamentInput(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    participant_ids: list[int] = Field(min_length=2)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return value


class Match(BaseModel):
    id: int
    round: int
    position: int
    participant1: ParticipantSummary | None
    participant2: ParticipantSummary | None
    winner_id: int | None
    is_bye: bool


class TournamentSummary(BaseModel):
    id: int
    name: str
    status: str  # PREPARACION | GENERADO
    created_at: datetime
    bracket_generated_at: datetime | None
    participant_count: int
    total_rounds: int
    bye_count: int
    logos: list[str]


class TournamentDetail(TournamentSummary):
    participants: list[ParticipantSummary]
    matches: list[Match]


class HealthResponse(BaseModel):
    status: str
    database: str
