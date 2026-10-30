from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import database_url

engine = create_engine(database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# Columns added after a table already existed in MariaDB. create_all() only creates
# missing tables, so these are added by hand (see database/schema.sql).
ADDED_COLUMNS = {
    "tournaments": {
        "champion_id": "INT NULL REFERENCES participants (id)",
        "finished_at": "DATETIME NULL",
    },
}


def init_db() -> None:
    """Creates the tables if they do not exist yet (same structure as database/schema.sql)
    and adds the columns introduced in later phases."""
    from app import models  # noqa: F401  (registers the models in Base.metadata)

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, columns in ADDED_COLUMNS.items():
            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))


def get_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
