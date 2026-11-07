"""Structured error responses (API spec v0.1, section 2).

Every error has the shape::

    {"error": {"code": ..., "message": ..., "request_id": ..., "fields": [...]?}}

Validation errors never echo the submitted value back to the client.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("veylix.errors")

REQUEST_ID_HEADER = "X-Request-ID"


class ApiError(Exception):
    """Raise this anywhere in the app to return a structured error."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        fields: list[dict[str, str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.fields = fields


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    fields: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    request_id = get_request_id(request)
    body: dict[str, Any] = {"code": code, "message": message, "request_id": request_id}
    if fields:
        body["fields"] = fields
    return JSONResponse(
        status_code=status_code,
        content={"error": body},
        headers={REQUEST_ID_HEADER: request_id, **(headers or {})},
    )


# Map Pydantic error types to the stable `reason` values in the API spec.
def _reason(error_type: str) -> str:
    if error_type == "missing":
        return "required"
    if error_type in ("string_too_long", "too_long"):
        return "too_long"
    if error_type in ("string_too_short", "too_short"):
        return "too_short"
    return "invalid_value"


_STATUS_CODES = {
    404: ("not_found", "The requested resource was not found."),
    405: ("method_not_allowed", "This method is not allowed for this resource."),
}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return error_response(request, exc.status_code, exc.code, exc.message, exc.fields)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Only field name + reason. The submitted value ("input") is dropped.
        fields = []
        for err in exc.errors():
            loc = [str(part) for part in err.get("loc", ()) if part != "body"]
            fields.append({"field": ".".join(loc) or "body", "reason": _reason(err.get("type", ""))})
        return error_response(
            request, 422, "validation_error", "The request is invalid.", fields
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code, message = _STATUS_CODES.get(
            exc.status_code, ("http_error", "The request could not be completed.")
        )
        return error_response(request, exc.status_code, code, message)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # Log the error type and request ID only: no request body, no message
        # text (which could contain user input).
        logger.error(
            "Unhandled error type=%s request_id=%s",
            type(exc).__name__,
            get_request_id(request),
        )
        return error_response(
            request, 500, "internal_error", "An unexpected error occurred."
        )
