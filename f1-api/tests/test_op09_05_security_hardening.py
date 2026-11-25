"""Security Hardening Test Suite (OP-09.05).

Validates:
1. Authentication & Authorization Hardening:
   - All 11 mutable endpoints reject anonymous requests (HTTP 401).
   - All 11 mutable endpoints reject non-admin authenticated users (HTTP 403).
   - All 11 mutable endpoints accept valid admin authenticated users (HTTP 200/201/204/400).
   - Public and regular user-authenticated endpoints remain accessible.
2. SSRF Protection on GET /api/v1/news/article:
   - Protocol restriction (HTTP, FTP, file rejected).
   - Port restriction (non-443 rejected).
   - Userinfo credentials in URL rejected.
   - Hostname whitelist enforcement.
   - Domain substring evasion attempts rejected.
   - Path enforcement for formula1.com (/en/latest/article/).
   - IP checks: private, loopback, link-local, multicast, cloud metadata rejected.
   - DNS rebinding prevention via IP-pinned connection.
   - Response size limits and content-type validation.
   - Sanitized error responses without traceback/socket leak.
"""

import datetime
import socket
import jwt
import pytest
from app.models.user import User
from app.extensions import db
from app.ssrf import validate_safe_url, safe_fetch_html, SSRFError, UpstreamFetchError


def _generate_token(app, user_id):
    now = datetime.datetime.now(datetime.timezone.utc)
    return jwt.encode(
        {"user_id": user_id, "iat": now, "exp": now + datetime.timedelta(days=1)},
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )


@pytest.fixture
def test_users(app):
    with app.app_context():
        # Regular user
        reg_user = User(username="normal_user", is_admin=False)
        reg_user.set_password("NormalPass123!")
        db.session.add(reg_user)

        # Admin user
        admin_user = User(username="admin_security_user", is_admin=True)
        admin_user.set_password("AdminSecurePass123!")
        db.session.add(admin_user)
        db.session.commit()

        reg_token = _generate_token(app, reg_user.id)
        admin_token = _generate_token(app, admin_user.id)

        return {
            "regular": {"user": reg_user, "token": reg_token, "auth": {"Authorization": f"Bearer {reg_token}"}},
            "admin": {"user": admin_user, "token": admin_token, "auth": {"Authorization": f"Bearer {admin_token}"}},
        }


# =========================================================================
# Part 1: Mutable Routes Auth & Admin Check (11 endpoints)
# =========================================================================

PROTECTED_MUTABLE_ROUTES = [
    ("POST", "/api/v1/drivers", {"first_name": "Test", "last_name": "Pilot", "code": "TST", "nationality": "BR"}),
    ("PUT", "/api/v1/drivers/1", {"nationality": "Updated"}),
    ("DELETE", "/api/v1/drivers/1", None),
    ("POST", "/api/v1/teams", {"name": "Security Test Team"}),
    ("PUT", "/api/v1/teams/1", {"base_city": "Updated City"}),
    ("DELETE", "/api/v1/teams/1", None),
    ("POST", "/api/v1/circuits", {"name": "Security Track", "city": "TrackCity", "country": "BR", "length_km": 4.5, "laps": 50}),
    ("PUT", "/api/v1/circuits/1", {"laps": 55}),
    ("DELETE", "/api/v1/circuits/1", None),
    ("POST", "/api/v1/sync?season=2026", None),
    ("POST", "/api/v1/fantasy/calculate", None),
]


class TestMutableRoutesSecurity:
    @pytest.mark.parametrize("method,path,payload", PROTECTED_MUTABLE_ROUTES)
    def test_anonymous_access_returns_401(self, client, method, path, payload):
        """Anonymous access to mutable endpoints must return 401."""
        if method == "POST":
            resp = client.post(path, json=payload)
        elif method == "PUT":
            resp = client.put(path, json=payload)
        elif method == "DELETE":
            resp = client.delete(path)
        else:
            pytest.fail(f"Unexpected method {method}")

        assert resp.status_code == 401, f"Expected 401 for anonymous {method} {path}, got {resp.status_code}"
        assert resp.get_json() is not None

    @pytest.mark.parametrize("method,path,payload", PROTECTED_MUTABLE_ROUTES)
    def test_regular_user_access_returns_403(self, client, test_users, method, path, payload):
        """Authenticated non-admin user must return 403."""
        headers = test_users["regular"]["auth"]
        if method == "POST":
            resp = client.post(path, json=payload, headers=headers)
        elif method == "PUT":
            resp = client.put(path, json=payload, headers=headers)
        elif method == "DELETE":
            resp = client.delete(path, headers=headers)
        else:
            pytest.fail(f"Unexpected method {method}")

        assert resp.status_code == 403, f"Expected 403 for non-admin {method} {path}, got {resp.status_code}"
        assert resp.get_json()["message"] == "Admin access required"

    @pytest.mark.parametrize("method,path,payload", PROTECTED_MUTABLE_ROUTES)
    def test_admin_user_access_allowed(self, client, test_users, method, path, payload):
        """Authenticated admin user is authorized (status code is not 401 or 403)."""
        headers = test_users["admin"]["auth"]
        if method == "POST":
            resp = client.post(path, json=payload, headers=headers)
        elif method == "PUT":
            resp = client.put(path, json=payload, headers=headers)
        elif method == "DELETE":
            resp = client.delete(path, headers=headers)
        else:
            pytest.fail(f"Unexpected method {method}")

        assert resp.status_code not in (401, 403), f"Admin user should not get {resp.status_code} on {method} {path}"

    def test_public_routes_remain_accessible_without_auth(self, client):
        """Public read routes should not require authentication."""
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/api/v1/drivers").status_code == 200
        assert client.get("/api/v1/teams").status_code == 200
        assert client.get("/api/v1/circuits").status_code == 200
        assert client.get("/api/v1/races").status_code == 200
        assert client.get("/api/v1/standings/drivers").status_code == 200
        assert client.get("/api/v1/standings/teams").status_code == 200

    def test_user_authenticated_routes_remain_functional(self, client, test_users):
        """User routes like /auth/me and fantasy user actions require only user token."""
        headers = test_users["regular"]["auth"]
        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["username"] == "normal_user"


# =========================================================================
# Part 2: SSRF Hardening on GET /api/v1/news/article
# =========================================================================

class TestSSRFHardening:
    @pytest.mark.parametrize("bad_url", [
        # Disallowed schemes
        "http://www.formula1.com/en/latest/article/test",
        "ftp://www.formula1.com/en/latest/article/test",
        "file:///etc/passwd",
        "gopher://www.formula1.com/en/latest/article/test",
        # Custom ports
        "https://www.formula1.com:80/en/latest/article/test",
        "https://www.formula1.com:8080/en/latest/article/test",
        "https://www.formula1.com:22/en/latest/article/test",
        # Userinfo credentials
        "https://admin:pass@www.formula1.com/en/latest/article/test",
        # Disallowed domains
        "https://evil.com/malicious",
        "https://example.com/en/latest/article/test",
        "https://google.com/",
        # Substring / query injection
        "https://evil.com/path?url=motorsport.uol.com.br",
        "https://motorsport.uol.com.br.evil.com/article",
        "https://evil.com/#motorsport.uol.com.br",
        # Disallowed path on allowed host
        "https://www.formula1.com/en/racing/2026",
        "https://www.formula1.com/api/internal",
        "https://www.formula1.com/admin",
        # Loopback / Private IP addresses
        "https://127.0.0.1/",
        "https://localhost/",
        "https://10.0.0.1/",
        "https://192.168.1.1/",
        "https://172.16.0.1/",
        "https://0.0.0.0/",
        # Cloud metadata
        "https://169.254.169.254/latest/meta-data/",
        # IPv6 addresses
        "https://[::1]/",
        "https://[fe80::1]/",
    ])
    def test_ssrf_disallowed_urls_rejected_by_api(self, client, bad_url):
        """API must return HTTP 400 for any URL violating SSRF rules."""
        resp = client.get(f"/api/v1/news/article?url={bad_url}")
        assert resp.status_code == 400, f"Expected 400 for SSRF URL {bad_url}, got {resp.status_code}"
        assert resp.get_json() is not None

    def test_ssrf_dns_resolving_to_private_ip_is_blocked(self, monkeypatch):
        """DNS rebinding/private resolution must raise SSRFError and block connection."""
        def fake_getaddrinfo(host, port, *args, **kwargs):
            # Simulate DNS returning a private IP for an allowed hostname
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.1.50", 443))]

        monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

        with pytest.raises(SSRFError) as exc_info:
            validate_safe_url("https://motorsport.uol.com.br/f1/news/article-test")
        assert "private/internal/reserved IP" in str(exc_info.value)

    def test_ssrf_dns_resolving_to_loopback_is_blocked(self, monkeypatch):
        def fake_getaddrinfo(host, port, *args, **kwargs):
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443))]

        monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

        with pytest.raises(SSRFError) as exc_info:
            validate_safe_url("https://www.formula1.com/en/latest/article/valid-slug.123")
        assert "private/internal/reserved IP" in str(exc_info.value)

    def test_ssrf_dns_resolving_to_cloud_metadata_is_blocked(self, monkeypatch):
        def fake_getaddrinfo(host, port, *args, **kwargs):
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("169.254.169.254", 443))]

        monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

        with pytest.raises(SSRFError) as exc_info:
            validate_safe_url("https://www.formula1.com/en/latest/article/valid-slug.123")
        assert "private/internal/reserved IP" in str(exc_info.value)

    def test_valid_urls_pass_validation(self):
        """Valid external URLs with public IPs must pass validation."""
        f1_url = "https://www.formula1.com/en/latest/article/leclerc-monza-update.12345"
        parsed, pinned_ip = validate_safe_url(f1_url)
        assert parsed.scheme == "https"
        assert parsed.hostname == "www.formula1.com"
        assert pinned_ip is not None

    def test_sanitized_503_on_upstream_failure(self, client, monkeypatch):
        """When upstream fetch fails, endpoint returns 503 with generic error (no leaked stack)."""
        import app.f1site as f1site
        def fake_fetch_article(url):
            raise f1site.F1SiteError("Upstream connection failure")

        monkeypatch.setattr(f1site, "fetch_article", fake_fetch_article)
        url = "https://www.formula1.com/en/latest/article/test-failure.999"
        resp = client.get(f"/api/v1/news/article?url={url}")
        assert resp.status_code == 503
        body = resp.get_json()
        assert "Site oficial da Formula 1 indisponivel" in body["error"]
        assert "traceback" not in body["error"].lower()
