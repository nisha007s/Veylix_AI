"""URL normalization and parsing, shared by the live scanner and ML training.

Pure text processing only: this module never fetches, resolves or connects to
anything (PRD §8, SRS FR-050). Registered domains come from tldextract's
bundled Public Suffix List snapshot with downloads and caching disabled.

Callers must enforce the input length limit before calling ``parse_url``.
"""

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlsplit

import tldextract

URL_PARSING_VERSION = "0.1.0"

ALLOWED_SCHEMES = ("http", "https")

# Offline extractor: no suffix-list URLs (no downloads), no cache directory
# (no file writes). tldextract then uses the snapshot shipped with the package.
OFFLINE_EXTRACTOR = tldextract.TLDExtract(suffix_list_urls=(), cache_dir=None)

_SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.\-]{0,15}://")
# Characters that can never appear in a valid host name.
_BAD_HOST_CHARS = set(" \t\r\n<>\"{}|\\^`%")


class UrlParseError(ValueError):
    """The input cannot be parsed as an http(s) URL."""


@dataclass(frozen=True)
class ParsedUrl:
    scheme: str
    has_userinfo: bool
    host: str                 # lower-case, no trailing dot, brackets removed for IPv6
    port: int | None          # only when explicitly given
    path: str
    query: str
    fragment: str
    registered_domain: str    # e.g. "example.co.uk"; the host itself if no known suffix
    subdomain: str            # e.g. "login.secure"
    suffix: str               # e.g. "co.uk"; "" if unknown
    is_ip_host: bool
    ip_format: str | None     # "ipv4", "ipv4_alternate", "ipv6" or None
    normalizations: tuple[str, ...]


def reverse_defang(text: str) -> tuple[str, bool]:
    """Undo common defanging (hxxp, [.], (.), [:]) so the URL can be analysed."""
    result = text
    lowered = result.lower()
    if lowered.startswith("hxxps") or lowered.startswith("hxxp"):
        result = "http" + result[4:]
    for old, new in (("[.]", "."), ("(.)", "."), ("[dot]", "."), ("[:]", ":"), ("[://]", "://")):
        result = result.replace(old, new)
    return result, result != text


def _parse_ipv4_part(part: str) -> int | None:
    """Parse one inet_aton-style part: decimal, 0x hex or leading-zero octal."""
    if not part:
        return None
    try:
        if part.lower().startswith("0x"):
            return int(part[2:] or "0", 16)
        if len(part) > 1 and part.startswith("0"):
            return int(part[1:], 8)
        if part.isdigit():
            return int(part)
    except ValueError:
        return None
    return None


def classify_ip_host(host: str) -> str | None:
    """Return "ipv4", "ipv4_alternate", "ipv6" or None if the host is not an IP.

    Browsers accept alternate IPv4 forms such as 3232235777, 0xC0A80101 or
    0300.0250.0.1; attackers use them to disguise an IP address.
    """
    try:
        ip = ipaddress.ip_address(host)
        return "ipv6" if ip.version == 6 else "ipv4"
    except ValueError:
        pass

    parts = host.split(".")
    if not 1 <= len(parts) <= 4:
        return None
    values = [_parse_ipv4_part(p) for p in parts]
    if any(v is None for v in values):
        return None
    # inet_aton rules: the last part fills the remaining bytes.
    *head, last = values
    if any(v > 255 for v in head) or last >= 256 ** (4 - len(head)):
        return None
    return "ipv4_alternate"


def parse_url(raw: str) -> ParsedUrl:
    """Normalize and split a URL string. Raises ``UrlParseError`` if invalid."""
    text = raw.strip()
    normalizations: list[str] = []

    text, defanged = reverse_defang(text)
    if defanged:
        normalizations.append("defang_reversed")

    if not _SCHEME_RE.match(text):
        text = "http://" + text
        normalizations.append("scheme_added")

    try:
        parts = urlsplit(text)
        port = parts.port  # raises ValueError for non-numeric / out-of-range ports
    except ValueError as exc:
        raise UrlParseError("invalid URL structure") from exc

    scheme = parts.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise UrlParseError("only http and https URLs are supported")

    host = (parts.hostname or "").rstrip(".")
    if not host or any(c in _BAD_HOST_CHARS for c in host):
        raise UrlParseError("missing or invalid host")

    ip_format = classify_ip_host(host)
    if ip_format:
        registered_domain, subdomain, suffix = host, "", ""
    else:
        if ".." in host or host.startswith("."):
            raise UrlParseError("invalid host")
        ext = OFFLINE_EXTRACTOR(host)
        registered_domain = ext.top_domain_under_public_suffix or host
        subdomain = ext.subdomain if ext.top_domain_under_public_suffix else ""
        suffix = ext.suffix

    return ParsedUrl(
        scheme=scheme,
        has_userinfo="@" in parts.netloc,
        host=host,
        port=port,
        path=parts.path,
        query=parts.query,
        fragment=parts.fragment,
        registered_domain=registered_domain,
        subdomain=subdomain,
        suffix=suffix,
        is_ip_host=ip_format is not None,
        ip_format=ip_format,
        normalizations=tuple(normalizations),
    )
