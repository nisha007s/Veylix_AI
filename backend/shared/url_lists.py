"""Indicator lists for URL analysis (approved for rule version 0.1.0 — OD-03).

Shared so that rules now, and ML features in Phase 3, use the same lists.
Changing a list changes results: bump the rule version when you do.
"""

# BR-007: well-known URL shortening services (compared with the registered domain).
URL_SHORTENERS = frozenset({
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorturl.at", "tiny.cc", "rb.gy", "t.ly", "s.id",
})

# BR-009: credential- and urgency-related terms (matched in lower-case host, path and query).
SUSPICIOUS_URL_TERMS = (
    "login", "log-in", "signin", "sign-in", "verify", "verification",
    "account", "update", "secure", "confirm", "password", "unlock",
    "suspend", "billing", "wallet",
)
