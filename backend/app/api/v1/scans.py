from fastapi import APIRouter, Request, Response

from app.core.errors import ApiError
from app.detection.errors import InvalidInput
from app.scans.schemas import EmailScanRequest, EmailScanResult, ScanResult, UrlScanRequest
from app.scans.service import run_email_scan, run_url_scan

router = APIRouter(prefix="/scans", tags=["scans"])


def _validation_error(field: str, exc: InvalidInput) -> ApiError:
    return ApiError(422, "validation_error", exc.message, [{"field": field, "reason": exc.reason}])


# Normal (non-async) functions: FastAPI runs them in a worker thread, so
# CPU-bound analysis never blocks other requests (SAD §9.5).
@router.post("/url", response_model=ScanResult)
def scan_url(body: UrlScanRequest, request: Request, response: Response) -> ScanResult:
    response.headers["Cache-Control"] = "no-store"
    try:
        return run_url_scan(body.url, request.app.state.settings)
    except InvalidInput as exc:
        raise _validation_error("url", exc) from None


@router.post("/email", response_model=EmailScanResult)
def scan_email(body: EmailScanRequest, request: Request, response: Response) -> EmailScanResult:
    response.headers["Cache-Control"] = "no-store"
    try:
        return run_email_scan(body.text, request.app.state.settings)
    except InvalidInput as exc:
        raise _validation_error("text", exc) from None
