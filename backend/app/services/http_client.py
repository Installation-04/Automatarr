"""Shared pooled httpx client.

Every service previously opened a fresh AsyncClient (and TLS handshake) per
request. This module holds one process-wide client with connection pooling;
callers pass per-request timeouts where they need tighter bounds.
"""
import httpx
from typing import Optional

_client: Optional[httpx.AsyncClient] = None

DEFAULT_TIMEOUT = httpx.Timeout(30.0)


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=DEFAULT_TIMEOUT,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            follow_redirects=True,
        )
    return _client


async def close_client():
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None
