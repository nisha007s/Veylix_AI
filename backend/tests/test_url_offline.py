"""URL analysis must work fully offline (SRS FR-050, SEC-080, SI-004)."""

import pytest
import tldextract

from app.detection.url.analyzer import analyze_url
from shared.url_parsing import OFFLINE_EXTRACTOR, parse_url
from tests.network_guard import NetworkAttempted, no_network  # noqa: F401 (fixture)

SAMPLES = [
    "https://login.secure.example.co.uk/verify?token=abc",
    "http://3232235777/login",
    "https://xn--pypal-4ve.com",
    "https://bit.ly/abc",
    "https://user@evil.example.dev",
    "example.org",
]


def test_extractor_has_no_download_urls_and_no_cache():
    assert OFFLINE_EXTRACTOR.suffix_list_urls == ()
    assert OFFLINE_EXTRACTOR._cache.enabled is False


def test_network_guard_actually_blocks(no_network):
    import requests
    with pytest.raises(NetworkAttempted):
        requests.get("https://example.com")


def test_fresh_extractor_loads_bundled_list_without_network(no_network):
    # A new extractor must load its suffix list from the bundled snapshot.
    extractor = tldextract.TLDExtract(suffix_list_urls=(), cache_dir=None)
    assert extractor("a.b.example.co.uk").top_domain_under_public_suffix == "example.co.uk"


@pytest.mark.parametrize("url", SAMPLES)
def test_parsing_makes_no_network_requests(no_network, url):
    parse_url(url)


@pytest.mark.parametrize("url", SAMPLES)
def test_full_analysis_makes_no_network_requests(no_network, url):
    analyze_url(url, max_length=2048)


def test_detection_code_does_not_import_network_libraries():
    """No HTTP client in detection or shared code (SAD §12.1)."""
    import ast
    from pathlib import Path

    import app.detection
    import shared

    forbidden = {"requests", "httpx", "urllib.request", "http.client", "socket", "aiohttp"}
    for package in (app.detection, shared):
        for path in Path(package.__file__).parent.rglob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            for node in ast.walk(tree):
                names = []
                if isinstance(node, ast.Import):
                    names = [a.name for a in node.names]
                elif isinstance(node, ast.ImportFrom) and node.module:
                    names = [node.module]
                for name in names:
                    assert name not in forbidden, f"{path.name} imports {name}"
