"""Application factory.

Run locally (from the project root, with the virtual environment active):

    uvicorn app.main:create_app --factory --reload --app-dir backend

``--factory`` means settings are loaded only when the server starts, not when
the module is imported (so tests never read a local .env file).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import REQUEST_ID_HEADER, register_exception_handlers
from app.core.middleware import BodySizeLimitMiddleware, RequestIDMiddleware

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    # Swagger UI / OpenAPI only outside production (SRS API-003).
    docs_enabled = not settings.is_production
    app = FastAPI(
        title="Veylix AI API",
        version="0.1.0",
        docs_url=f"{API_PREFIX}/docs" if docs_enabled else None,
        redoc_url=None,
        openapi_url=f"{API_PREFIX}/openapi.json" if docs_enabled else None,
    )
    app.state.settings = settings

    register_exception_handlers(app)
    app.include_router(api_router, prefix=API_PREFIX)

    # Middleware added last runs first: RequestID -> CORS -> body size limit.
    app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.max_scan_body_bytes)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
        expose_headers=[REQUEST_ID_HEADER],
    )
    app.add_middleware(RequestIDMiddleware)

    return app
