from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Report that the server is running. Reveals no configuration or model details."""
    return {"status": "ok"}
