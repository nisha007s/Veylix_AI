"""Email text preprocessing, shared by the live scanner and ML training.

Pure text processing: no network, no storage, no logging. Raw email text only
ever lives in memory for the duration of one call.

Callers must enforce the input length limit before calling ``preprocess_email``.
"""

import re
from dataclasses import dataclass
from html.parser import HTMLParser

EMAIL_PREPROCESSING_VERSION = "0.1.0"

# Bounded patterns only (SRS SEC-071).
_HTML_HINT_RE = re.compile(
    r"<\s*/?\s*(?:html|head|body|div|p|a|br|span|table|tr|td|img|font|style|script|b|i|u|strong)\b",
    re.IGNORECASE,
)
_URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>\"'`]{1,2048}", re.IGNORECASE)
_TRAILING_PUNCT = ".,;:!?)]}'\""
_WHITESPACE_RE = re.compile(r"\s+")

_SKIP_TAGS = {"script", "style", "noscript", "template"}
_BLOCK_TAGS = {"p", "div", "br", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "table", "hr"}
_LINK_ATTRS = {"a": "href", "area": "href"}


@dataclass(frozen=True)
class PreprocessedEmail:
    text: str               # normalized: lower-case, single spaces, straight quotes
    urls: tuple[str, ...]   # unique links in order of appearance (visible text + HTML hrefs)
    html_converted: bool


def normalize_text(text: str) -> str:
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return _WHITESPACE_RE.sub(" ", text).strip().lower()


def looks_like_html(text: str) -> bool:
    return _HTML_HINT_RE.search(text) is not None


def _urls_in(text: str) -> list[str]:
    found = []
    for match in _URL_RE.finditer(text):
        url = match.group(0).rstrip(_TRAILING_PUNCT)
        if url:
            found.append(url)
    return found


class _HtmlToText(HTMLParser):
    """Collect visible text and link targets. Nothing is ever rendered."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.urls: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip_depth += 1
            return
        if tag in _BLOCK_TAGS:
            self.parts.append("\n")
        attr = _LINK_ATTRS.get(tag)
        if attr:
            for name, value in attrs:
                if name == attr and value:
                    self.urls.extend(_urls_in(value.strip()))

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip_depth:
            self._skip_depth -= 1
        elif tag in _BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip_depth:
            self.parts.append(data)
            self.urls.extend(_urls_in(data))


def _unique(items: list[str]) -> tuple[str, ...]:
    return tuple(dict.fromkeys(items))


def preprocess_email(raw: str) -> PreprocessedEmail:
    if looks_like_html(raw):
        parser = _HtmlToText()
        parser.feed(raw)
        parser.close()
        return PreprocessedEmail(
            text=normalize_text("".join(parser.parts)),
            urls=_unique(parser.urls),
            html_converted=True,
        )
    return PreprocessedEmail(text=normalize_text(raw), urls=_unique(_urls_in(raw)), html_converted=False)


# ---------- Phrase matching ----------

_NEGATIONS = ("never", "not", "don't", "dont", "won't", "cannot", "can't", "no one")
_CLAUSE_END = ".!?\n,;:"
NEGATION_WINDOW = 40


def _is_word_boundary(text: str, start: int, end: int) -> bool:
    before = text[start - 1] if start > 0 else " "
    after = text[end] if end < len(text) else " "
    return not before.isalnum() and not after.isalnum()


def _is_negated(text: str, start: int) -> bool:
    window = text[max(0, start - NEGATION_WINDOW):start]
    # Only look within the same clause.
    for mark in _CLAUSE_END:
        window = window.rsplit(mark, 1)[-1]
    window = f" {window} "
    return any(f" {neg} " in window for neg in _NEGATIONS)


def find_phrases(text: str, phrases: tuple[str, ...], check_negation: bool = False) -> list[str]:
    """Return the phrases that occur in ``text`` as whole words.

    With ``check_negation``, an occurrence preceded in the same clause by a
    negation (e.g. "we will never ask you to share your otp") does not count.
    Plain substring search only: no regular expressions, so no ReDoS risk.
    """
    found = []
    for phrase in phrases:
        start = text.find(phrase)
        while start != -1:
            end = start + len(phrase)
            if _is_word_boundary(text, start, end) and not (
                check_negation and _is_negated(text, start)
            ):
                found.append(phrase)
                break
            start = text.find(phrase, start + 1)
    return found
