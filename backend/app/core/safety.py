"""Safe display helpers for untrusted input."""

import re

_HTTP_RE = re.compile(r"http", re.IGNORECASE)


def defang(text: str) -> str:
    """Make a URL non-clickable: http -> hxxp and every "." -> "[.]".

    Example: https://example.com/a.html -> hxxps://example[.]com/a[.]html
    """
    return _HTTP_RE.sub("hxxp", text).replace(".", "[.]")
