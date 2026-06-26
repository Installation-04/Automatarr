import httpx
from typing import Optional


class ZileanClient:
    def __init__(self, base_url: str = "http://zilean:8182"):
        self.base_url = base_url.rstrip("/")

    async def search_movie(self, title: str, year: Optional[int] = None, imdb_id: Optional[str] = None) -> list[dict]:
        params: dict = {"Query": title}
        if year:
            params["Year"] = year
        if imdb_id:
            params["ImdbId"] = imdb_id
        params["MediaType"] = "movie"
        return await self._search(params)

    async def search_episode(self, title: str, season: int, episode: int, year: Optional[int] = None, imdb_id: Optional[str] = None) -> list[dict]:
        params: dict = {"Query": title, "Season": season, "Episode": episode}
        if year:
            params["Year"] = year
        if imdb_id:
            params["ImdbId"] = imdb_id
        params["MediaType"] = "show"
        return await self._search(params)

    async def _search(self, params: dict) -> list[dict]:
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                r = await client.get(f"{self.base_url}/search/torrents", params=params)
                if r.status_code != 200:
                    return []
                return r.json()
            except Exception:
                return []

    async def ping(self) -> bool:
        async with httpx.AsyncClient(timeout=5) as client:
            try:
                r = await client.get(f"{self.base_url}/healthchecks/ping")
                return r.status_code == 200
            except Exception:
                return False

    def to_streams(self, results: list[dict]) -> list[dict]:
        """Convert Zilean results to the same stream dict shape as Torrentio."""
        streams = []
        for r in results:
            info_hash = r.get("infoHash", "")
            if not info_hash:
                continue
            filename = r.get("filename", "")
            size_bytes = r.get("filesize", 0)
            size_gb = size_bytes / 1e9 if size_bytes else 0
            streams.append({
                "infoHash": info_hash.lower(),
                "name": "Zilean",
                "title": f"{filename}\n💾 {size_gb:.1f} GB",
                "behaviorHints": {"filename": filename},
            })
        return streams
