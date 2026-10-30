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


class HealthResponse(BaseModel):
    status: str
    database: str
