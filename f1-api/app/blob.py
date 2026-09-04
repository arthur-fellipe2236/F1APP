"""Upload simples no Vercel Blob (BLOB_READ_WRITE_TOKEN)."""

import os

import requests

API_URL = "https://vercel.com/api/blob"
TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip()


def enabled():
    return bool(TOKEN)


def upload_public(pathname, data, content_type):
    response = requests.put(
        f"{API_URL}/upload/public/{pathname}",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "x-api-version": "agsv1",
            "access": "public",
            "content-type": content_type,
        },
        data=data,
        timeout=40,
    )
    response.raise_for_status()
    return response.json()["url"]
