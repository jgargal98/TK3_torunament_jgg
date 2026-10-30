"""ORM models: how the data is stored in MariaDB."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Participant(Base):
    __tablename__ = "participants"
    # utf8mb4 is required to store emoji logos.
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nick: Mapped[str] = mapped_column(String(40), unique=True)
    logo: Mapped[str] = mapped_column(String(16))
    # Deactivating is the usual action instead of deleting: the history is kept.
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
