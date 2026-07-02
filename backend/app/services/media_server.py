import httpx
from typing import Optional


class PlexClient:
    def __init__(self, url: str, token: str):
        self.url = url.rstrip("/")
        self.token = token
        self.headers = {"X-Plex-Token": token, "Accept": "application/json"}

    async def get_libraries(self) -> list[dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{self.url}/library/sections", headers=self.headers)
            r.raise_for_status()
            data = r.json()
            return data.get("MediaContainer", {}).get("Directory", [])

    async def refresh_library(self, library_key: str):
        async with httpx.AsyncClient(timeout=10) as client:
            await client.get(
                f"{self.url}/library/sections/{library_key}/refresh",
                headers=self.headers,
            )

    async def scan_path(self, library_key: str, path: str):
        async with httpx.AsyncClient(timeout=10) as client:
            await client.get(
                f"{self.url}/library/sections/{library_key}/refresh",
                headers=self.headers,
                params={"path": path},
            )

    async def test(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(f"{self.url}/identity", headers=self.headers)
                return r.status_code == 200
        except Exception:
            return False


class JellyfinClient:
    def __init__(self, url: str, api_key: str):
        self.url = url.rstrip("/")
        self.api_key = api_key
        self.headers = {"X-Emby-Token": api_key}

    async def get_libraries(self) -> list[dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{self.url}/Library/VirtualFolders", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def refresh_library(self):
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{self.url}/Library/Refresh", headers=self.headers)

    async def scan_path(self, path: str):
        await self.refresh_library()

    async def test(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(f"{self.url}/System/Info/Public", headers=self.headers)
                return r.status_code == 200
        except Exception:
            return False


class EmbyClient(JellyfinClient):
    """Emby has the same API structure as Jellyfin."""
    pass


async def refresh_media_server(settings: dict, path: Optional[str] = None, media_type: str = "movie"):
    server = settings.get("media_server", "none")
    if server == "plex":
        url = settings.get("plex_url", "")
        token = settings.get("plex_token", "")
        if url and token:
            client = PlexClient(url, token)
            lib_key = settings.get("plex_movies_library" if media_type == "movie" else "plex_shows_library", "")
            if lib_key:
                await client.scan_path(lib_key, path or "")
            else:
                libs = await client.get_libraries()
                for lib in libs:
                    await client.refresh_library(lib["key"])

    elif server in ("jellyfin", "emby"):
        url = settings.get("jellyfin_url" if server == "jellyfin" else "emby_url", "")
        key = settings.get("jellyfin_api_key" if server == "jellyfin" else "emby_api_key", "")
        if url and key:
            client = EmbyClient(url, key) if server == "emby" else JellyfinClient(url, key)
            await client.refresh_library()
