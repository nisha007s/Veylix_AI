import pytest

from shared.url_parsing import UrlParseError, classify_ip_host, parse_url, reverse_defang


# ---------- Normalization ----------

def test_missing_scheme_is_added_and_recorded():
    p = parse_url("example.com/login")
    assert p.scheme == "http"
    assert p.host == "example.com"
    assert p.path == "/login"
    assert "scheme_added" in p.normalizations


def test_existing_scheme_is_kept():
    p = parse_url("https://example.com")
    assert p.scheme == "https"
    assert p.normalizations == ()


def test_host_without_scheme_but_with_port():
    p = parse_url("example.com:8080/path")
    assert p.host == "example.com"
    assert p.port == 8080


@pytest.mark.parametrize("defanged, expected", [
    ("hxxps://example[.]com/a", "https://example.com/a"),
    ("hxxp://example(.)com", "http://example.com"),
    ("example[dot]com", "example.com"),
])
def test_reverse_defang(defanged, expected):
    assert reverse_defang(defanged) == (expected, True)


def test_defanged_input_is_recorded():
    p = parse_url("hxxps://evil[.]example[.]com")
    assert p.host == "evil.example.com"
    assert "defang_reversed" in p.normalizations


def test_host_is_lowercased_and_trailing_dot_removed():
    assert parse_url("http://EXAMPLE.com./").host == "example.com"


# ---------- Components ----------

def test_components_are_split():
    p = parse_url("https://user:pw@sub.example.com:8443/a/b?x=1#frag")
    assert p.has_userinfo is True
    assert p.host == "sub.example.com"
    assert p.port == 8443
    assert p.path == "/a/b"
    assert p.query == "x=1"
    assert p.fragment == "frag"


def test_no_explicit_port_is_none():
    assert parse_url("https://example.com").port is None


@pytest.mark.parametrize("url, registered, subdomain, suffix", [
    ("https://login.secure.example.co.uk/x", "example.co.uk", "login.secure", "co.uk"),
    ("https://www.example.com", "example.com", "www", "com"),
    ("https://example.com", "example.com", "", "com"),
])
def test_registered_domain(url, registered, subdomain, suffix):
    p = parse_url(url)
    assert (p.registered_domain, p.subdomain, p.suffix) == (registered, subdomain, suffix)


def test_host_without_known_suffix_uses_host_as_registered_domain():
    p = parse_url("http://intranet/")
    assert p.registered_domain == "intranet"
    assert p.suffix == ""


# ---------- IP hosts (including alternate formats) ----------

@pytest.mark.parametrize("host, expected", [
    ("192.168.1.1", "ipv4"),
    ("3232235777", "ipv4_alternate"),        # decimal
    ("0xC0A80101", "ipv4_alternate"),        # hex
    ("0300.0250.0.1", "ipv4_alternate"),     # octal
    ("0xc0.0xa8.1.1", "ipv4_alternate"),     # mixed
    ("192.168.257", "ipv4_alternate"),       # short form
    ("::1", "ipv6"),
    ("example.com", None),
    ("1.2.3.4.5", None),
    ("256.1.1.1", None),
    ("0x1g.1.1.1", None),
])
def test_classify_ip_host(host, expected):
    assert classify_ip_host(host) == expected


def test_ipv6_url_parses():
    p = parse_url("http://[2001:db8::1]:8080/x")
    assert p.is_ip_host and p.ip_format == "ipv6"
    assert p.host == "2001:db8::1"


# ---------- Invalid input ----------

@pytest.mark.parametrize("bad", [
    "ftp://example.com/file",       # unsupported scheme
    "javascript:alert(1)",          # not a web address
    "http://",                      # no host
    "http://exa mple.com",          # space in host
    "http://example.com:99999",     # port out of range
    "http://example.com:abc",       # non-numeric port
    "http://[::1",                  # broken IPv6 brackets
    "http://example..com",          # empty label
])
def test_unparseable_input_raises(bad):
    with pytest.raises(UrlParseError):
        parse_url(bad)


def test_unicode_host_parses():
    p = parse_url("https://pаypal.com")  # Cyrillic "а"
    assert not p.host.isascii()
