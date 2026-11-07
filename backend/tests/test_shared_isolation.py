"""S2: backend/shared/ is pure logic, reusable by offline ML training.

It must not import the web framework, the database, the app package or any
network library.
"""

import ast
from pathlib import Path

import shared

FORBIDDEN = {
    "app", "fastapi", "starlette", "uvicorn", "sqlalchemy", "alembic",
    "httpx", "requests", "urllib3", "aiohttp", "socket", "http", "urllib.request",
}


def _imports(path: Path) -> set[str]:
    names = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module)
    return names


def test_shared_has_no_forbidden_imports():
    shared_dir = Path(shared.__file__).parent
    for path in shared_dir.rglob("*.py"):
        for name in _imports(path):
            for bad in FORBIDDEN:
                assert name != bad and not name.startswith(bad + "."), (
                    f"{path.name} imports forbidden module {name!r}"
                )
