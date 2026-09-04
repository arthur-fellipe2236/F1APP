"""Proxy de midia otimizada (WebP redimensionado) com espelho no Blob.

GET /api/v1/media/proxy?url=<origem>&w=<largura>
- origem limitada a CDNs conhecidos (anti-SSRF)
- resultado otimizado e gravado no Vercel Blob (se BLOB_READ_WRITE_TOKEN
  existir) e mapeado no cache compartilhado (Redis); responde 302
- sem Blob, devolve o WebP diretamente com cache-control longo
"""

import hashlib
import io
from urllib.parse import urlparse

import requests
from flask import Blueprint, make_response, redirect, request
from PIL import Image

from .. import blob, cache
from .helpers import ApiError, parse_int

bp = Blueprint("media", __name__)

ALLOWED_HOSTS = (
    "media.formula1.com",
    "www.formula1.com",
    "flagcdn.com",
    "upload.wikimedia.org",
)
USER_AGENT = "Mozilla/5.0 (compatible; f1-api/1.0; media-proxy)"
CACHE_TTL = 30 * 24 * 3600

_image_cache = {}


def _optimized_bytes(url, width):
    response = requests.get(
        url, headers={"User-Agent": USER_AGENT}, timeout=30
    )
    if response.status_code != 200:
        raise ApiError("origem da midia indisponivel", 502)
    image = Image.open(io.BytesIO(response.content))
    if image.width > width:
        height = max(1, round(image.height * width / image.width))
        image = image.resize((width, height), Image.LANCZOS)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=80, method=4)
    return buffer.getvalue()


@bp.get("/media/proxy")
def media_proxy():
    """
    Proxy otimizado de imagens (WebP + Blob)
    ---
    tags:
      - Media
    parameters:
      - in: query
        name: url
        required: true
        schema:
          type: string
        description: URL da imagem (CDNs oficiais permitidos)
      - in: query
        name: w
        schema:
          type: integer
          default: 640
          minimum: 16
          maximum: 1280
        description: Largura maxima em pixels
    responses:
      302:
        description: Redirecionamento para o Blob publico otimizado
      200:
        description: WebP otimizado (sem Blob configurado)
        content:
          image/webp:
            schema:
              type: string
              format: binary
      400:
        description: URL fora da lista permitida
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    url = request.args.get("url") or ""
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
        raise ApiError(
            "Somente imagens de formula1.com, flagcdn.com e wikimedia.org",
            400,
        )
    width = parse_int(request.args.get("w"), "w") or 640
    width = max(16, min(width, 1280))

    key = hashlib.sha1(f"{url}|{width}".encode()).hexdigest()
    redis_hit = cache.get(f"media:{key}")
    if redis_hit:
        return redirect(redis_hit, code=302)

    if key in _image_cache:
        stored_url, data = _image_cache[key]
    else:
        try:
            data = _optimized_bytes(url, width)
        except (ApiError, OSError, requests.RequestException):
            return redirect(url, code=302)
        stored_url = None
        if blob.enabled():
            try:
                stored_url = blob.upload_public(
                    f"media/{key}.webp", data, "image/webp"
                )
            except requests.RequestException:
                stored_url = None
        if stored_url:
            cache.set(f"media:{key}", stored_url, CACHE_TTL)
        else:
            _image_cache[key] = (stored_url, data)
            if len(_image_cache) > 100:
                _image_cache.pop(next(iter(_image_cache)))

    if stored_url:
        return redirect(stored_url, code=302)

    response = make_response(data)
    response.headers["Content-Type"] = "image/webp"
    response.headers["Cache-Control"] = "public, max-age=2592000, immutable"
    return response
