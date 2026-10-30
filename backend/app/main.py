from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api import health, participants
from app.database import init_db
from app.services.errors import NotFoundError, RuleError


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        init_db()
    except OperationalError as error:
        # The API still starts; every request will answer 503 until MariaDB is reachable.
        print(f"AVISO: no se pudo conectar con MariaDB al arrancar: {error.orig}")
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="TK3 KO Tournament Manager API",
        description="API REST del gestor de torneos KO. Fase 1: gestión de participantes.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:4200"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(NotFoundError)
    def not_found(_: Request, error: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": error.message})

    @application.exception_handler(RuleError)
    def rule_broken(_: Request, error: RuleError) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content={"detail": error.message})

    @application.exception_handler(OperationalError)
    def database_down(_: Request, __: OperationalError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={"detail": "No se puede conectar con la base de datos MariaDB"},
        )

    api = APIRouter(prefix="/api")
    api.include_router(health.router)
    api.include_router(participants.router)
    application.include_router(api)
    return application


app = create_app()
