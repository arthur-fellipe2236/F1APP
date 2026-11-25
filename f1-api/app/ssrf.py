"""SSRF Protection and Safe HTTP Fetching Module.

Provides strict URL validation, DNS resolution checks, private/reserved IP
filtering, DNS rebinding prevention via IP-pinned connections, hop-by-hop
redirect validation, timeouts, content-type verification, and response size limits.
"""

import ipaddress
import socket
import urllib.parse
from typing import Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPSConnection
from urllib3.connectionpool import HTTPSConnectionPool
import urllib3.util.connection as urllib3_conn


class SSRFError(Exception):
    """Raised when a URL or target violates SSRF security policy."""


class UpstreamFetchError(Exception):
    """Raised when an external request fails safely without leaking internals."""


ALLOWED_HOSTS = {
    "www.formula1.com",
    "motorsport.uol.com.br",
    "br.motorsport.com",
}

F1_ARTICLE_PATH_PREFIX = "/en/latest/article/"

MAX_REDIRECTS = 3
CONNECT_TIMEOUT = 3.0
READ_TIMEOUT = 7.0
MAX_CONTENT_BYTES = 2 * 1024 * 1024  # 2 MB

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


class PinnedHTTPSConnection(HTTPSConnection):
    pinned_ip = None

    def _new_conn(self):
        extra_kw = {}
        if getattr(self, "source_address", None):
            extra_kw["source_address"] = self.source_address
        if getattr(self, "socket_options", None):
            extra_kw["socket_options"] = self.socket_options

        target_host = self.pinned_ip if self.pinned_ip else self.host
        conn = urllib3_conn.create_connection(
            (target_host, self.port),
            self.timeout,
            **extra_kw,
        )
        return conn


class PinnedHTTPSConnectionPool(HTTPSConnectionPool):
    ConnectionCls = PinnedHTTPSConnection

    def __init__(self, *args, **kwargs):
        self.pinned_ip = kwargs.pop("pinned_ip", None)
        super().__init__(*args, **kwargs)

    def _new_conn(self):
        conn = super()._new_conn()
        conn.pinned_ip = self.pinned_ip
        return conn


class PinnedIPAdapter(HTTPAdapter):
    def __init__(self, pinned_ip: str, **kwargs):
        self.pinned_ip = pinned_ip
        super().__init__(**kwargs)

    def get_connection(self, url, proxies=None):
        pool = super().get_connection(url, proxies=proxies)
        pool.pinned_ip = self.pinned_ip
        pool.ConnectionCls = PinnedHTTPSConnection
        return pool


def is_disallowed_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Returns True if the IP is private, loopback, link-local, multicast, or non-global."""
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return is_disallowed_ip(ip.ipv4_mapped)
    if not ip.is_global:
        return True
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return True
    # Carrier-grade NAT (100.64.0.0/10)
    if ip in ipaddress.ip_network("100.64.0.0/10"):
        return True
    # Explicit cloud metadata IP check
    if str(ip) == "169.254.169.254":
        return True
    return False


def validate_safe_url(url: str) -> Tuple[urllib.parse.SplitResult, str]:
    """Strictly validates URL against SSRF policy and resolves DNS.

    Returns:
        (parsed_url, pinned_ip)

    Raises:
        SSRFError: if validation fails.
    """
    if not url or not isinstance(url, str):
        raise SSRFError("URL parameter is required and must be a string")

    try:
        parsed = urllib.parse.urlsplit(url.strip())
    except Exception as exc:
        raise SSRFError(f"Malformed URL: {exc}") from exc

    # 1. Scheme check
    if parsed.scheme.lower() != "https":
        raise SSRFError("Only HTTPS protocol is supported")

    # 2. Port check
    if parsed.port is not None and parsed.port != 443:
        raise SSRFError(f"Port {parsed.port} is not allowed (only port 443 is permitted)")

    # 3. Userinfo / credentials check
    if parsed.username or parsed.password:
        raise SSRFError("Userinfo credentials in URL are strictly prohibited")

    # 4. Hostname check
    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise SSRFError("URL hostname is missing or empty")

    if hostname not in ALLOWED_HOSTS:
        raise SSRFError(f"Host '{hostname}' is not in the allowed domain whitelist")

    # 5. Domain-specific path checks
    if hostname == "www.formula1.com":
        if not parsed.path.startswith(F1_ARTICLE_PATH_PREFIX):
            raise SSRFError(
                f"Formula 1 article URL must start with path '{F1_ARTICLE_PATH_PREFIX}'"
            )

    # 6. DNS resolution & IP verification
    try:
        addr_info = socket.getaddrinfo(
            hostname, 443, socket.AF_UNSPEC, socket.SOCK_STREAM
        )
    except socket.gaierror as exc:
        raise SSRFError(f"DNS resolution failed for '{hostname}'") from exc

    resolved_ips = list({res[4][0] for res in addr_info})
    if not resolved_ips:
        raise SSRFError(f"No IP addresses resolved for '{hostname}'")

    for ip_str in resolved_ips:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError as exc:
            raise SSRFError(f"Invalid resolved IP '{ip_str}'") from exc

        if is_disallowed_ip(ip_obj):
            raise SSRFError(
                f"Access to private/internal/reserved IP '{ip_str}' is strictly forbidden"
            )

    return parsed, resolved_ips[0]


def safe_fetch_html(url: str, max_redirects: int = MAX_REDIRECTS) -> str:
    """Safely fetches external HTML content with DNS rebinding and SSRF protection.

    Args:
        url: The external HTTPS URL to fetch.
        max_redirects: Maximum number of redirects to follow (default 3).

    Returns:
        The decoded HTML response body.

    Raises:
        SSRFError: If any target or redirect violates security policy.
        UpstreamFetchError: If external fetch fails due to network or HTTP errors.
    """
    current_url = url
    redirect_count = 0

    while True:
        parsed, pinned_ip = validate_safe_url(current_url)

        session = requests.Session()
        session.headers.update(HEADERS)
        adapter = PinnedIPAdapter(pinned_ip)
        session.mount("https://", adapter)

        try:
            response = session.get(
                current_url,
                allow_redirects=False,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                stream=True,
            )
        except requests.exceptions.Timeout as exc:
            raise UpstreamFetchError("Connection timed out while fetching article") from exc
        except requests.exceptions.RequestException as exc:
            raise UpstreamFetchError(f"Network error while fetching article: {type(exc).__name__}") from exc
        finally:
            session.close()

        # Handle redirects manually hop-by-hop
        if response.status_code in (301, 302, 303, 307, 308):
            redirect_count += 1
            if redirect_count > max_redirects:
                raise SSRFError(f"Exceeded maximum allowed redirects ({max_redirects})")

            location = response.headers.get("Location")
            if not location:
                raise UpstreamFetchError("Redirect received without Location header")

            current_url = urllib.parse.urljoin(current_url, location)
            continue

        if response.status_code != 200:
            raise UpstreamFetchError(
                f"External provider returned HTTP status {response.status_code}"
            )

        # Content-Type check
        content_type = response.headers.get("Content-Type", "").lower()
        if not ("text/html" in content_type or "application/xhtml+xml" in content_type):
            raise SSRFError(
                f"Invalid Content-Type '{content_type}'; expected text/html"
            )

        # Stream content with size limit
        content = bytearray()
        try:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    content.extend(chunk)
                    if len(content) > MAX_CONTENT_BYTES:
                        raise SSRFError(
                            f"Response size exceeded limit ({MAX_CONTENT_BYTES} bytes)"
                        )
        except requests.exceptions.RequestException as exc:
            raise UpstreamFetchError("Error streaming article content") from exc

        encoding = response.encoding or "utf-8"
        try:
            return content.decode(encoding, errors="replace")
        except Exception:
            return content.decode("utf-8", errors="replace")
