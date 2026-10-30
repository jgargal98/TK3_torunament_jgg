import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()


def database_url() -> str:
    """Builds the MariaDB connection URL from the .env variables.

    DATABASE_URL takes precedence so tests can point to another database.
    """
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    name = os.getenv("DB_NAME", "tournament")
    user = quote_plus(os.getenv("DB_USER", "root"))
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"
