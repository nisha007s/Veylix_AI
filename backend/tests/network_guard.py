"""Test helper: make any outbound network attempt fail loudly."""

import socket

import pytest
import requests

LOOPBACK = {"127.0.0.1", "::1", "localhost"}


class NetworkAttempted(AssertionError):
    pass


@pytest.fixture
def no_network(monkeypatch):
    """Block DNS lookups, non-loopback connections and HTTP via requests.

    Loopback is allowed only because Python's event loop on Windows uses an
    internal local socket pair.
    """

    def blocked(*args, **kwargs):
        raise NetworkAttempted("network access attempted")

    real_connect = socket.socket.connect

    def guarded_connect(self, address):
        host = address[0] if isinstance(address, tuple) else address
        if host not in LOOPBACK:
            raise NetworkAttempted(f"connection attempted to {host!r}")
        return real_connect(self, address)

    monkeypatch.setattr(socket, "getaddrinfo", blocked)
    monkeypatch.setattr(socket, "gethostbyname", blocked)
    monkeypatch.setattr(socket, "create_connection", blocked)
    monkeypatch.setattr(socket.socket, "connect", guarded_connect)
    monkeypatch.setattr(requests.Session, "send", blocked)
