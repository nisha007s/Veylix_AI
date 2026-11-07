import time

import pytest

from shared.email_preprocessing import (
    find_phrases,
    looks_like_html,
    normalize_text,
    preprocess_email,
)


# ---------- Normalization ----------

def test_normalize_lowercases_collapses_whitespace_and_straightens_quotes():
    assert normalize_text("  Don’t   STOP\n\tnow ") == "don't stop now"


# ---------- Plain-text link extraction ----------

def test_extracts_links_in_order_and_strips_trailing_punctuation():
    e = preprocess_email("Visit https://a.example.com/x, then www.b.example.org. Or (http://c.example.net)!")
    assert e.urls == ("https://a.example.com/x", "www.b.example.org", "http://c.example.net")
    assert e.html_converted is False


def test_duplicate_links_are_counted_once():
    e = preprocess_email("https://a.example.com https://b.example.com https://a.example.com")
    assert e.urls == ("https://a.example.com", "https://b.example.com")


def test_text_without_links():
    assert preprocess_email("Hello, see you tomorrow.").urls == ()


# ---------- HTML ----------

@pytest.mark.parametrize("text, expected", [
    ("<p>Hello</p>", True),
    ("<HTML><BODY>x</BODY></HTML>", True),
    ("I think 3 < 5 and 7 > 2", False),
    ("Plain text email", False),
])
def test_looks_like_html(text, expected):
    assert looks_like_html(text) is expected


def test_html_is_converted_to_text_and_scripts_are_dropped():
    raw = ("<html><head><style>p{color:red}</style></head><body>"
           "<script>alert('XSS')</script><p>Hello&nbsp;&amp; welcome</p></body></html>")
    e = preprocess_email(raw)
    assert e.html_converted is True
    assert e.text == "hello & welcome"


def test_hidden_href_destination_is_extracted_with_visible_link():
    raw = '<p>Log in at <a href="http://192.168.1.1/login">https://www.mybank.com</a></p>'
    e = preprocess_email(raw)
    assert e.urls == ("http://192.168.1.1/login", "https://www.mybank.com")


@pytest.mark.parametrize("href", ["mailto:a@example.com", "javascript:alert(1)", "#top", "tel:123"])
def test_non_web_hrefs_are_ignored(href):
    assert preprocess_email(f'<a href="{href}">click</a>').urls == ()


# ---------- Phrase matching ----------

def test_whole_words_only():
    assert find_phrases("i love pineapple juice", ("apple",)) == []
    assert find_phrases("apple id locked", ("apple",)) == ["apple"]
    assert find_phrases("our company policy", ("pan",)) == []


def test_negation_in_same_clause_cancels_match():
    text = normalize_text("We will never ask you to share your OTP.")
    assert find_phrases(text, ("share your otp",), check_negation=True) == []


def test_negation_in_previous_sentence_does_not_cancel():
    text = normalize_text("Do not wait. Share your OTP now.")
    assert find_phrases(text, ("share your otp",), check_negation=True) == ["share your otp"]


def test_negation_in_previous_clause_does_not_cancel():
    text = normalize_text("We could not process your payment, send your card number today.")
    assert find_phrases(text, ("card number",), check_negation=True) == ["card number"]


def test_negation_is_ignored_when_not_requested():
    text = normalize_text("Never share your OTP.")
    assert find_phrases(text, ("share your otp",)) == ["share your otp"]


def test_preprocessing_is_fast_on_maximum_length_input():
    raw = ("Urgent: verify your account at https://example.com/login now. " * 800)[:50_000]
    start = time.perf_counter()
    preprocess_email(raw)
    assert time.perf_counter() - start < 1.0
