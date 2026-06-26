import httpx
from typing import Optional

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"


class TMDBClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def _params(self, extra: dict = None) -> dict:
        p = {"api_key": self.api_key}
        if extra:
            p.update(extra)
        return p

    def poster_url(self, path: Optional[str], size: str = "w500") -> Optional[str]:
        if not path:
            return None
        return f"{TMDB_IMAGE_BASE}/{size}{path}"

    async def search_movies(self, query: str, page: int = 1) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/search/movie",
                params=self._params({"query": query, "page": page}),
            )
            r.raise_for_status()
            return r.json()

    async def search_shows(self, query: str, page: int = 1) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/search/tv",
                params=self._params({"query": query, "page": page}),
            )
            r.raise_for_status()
            return r.json()

    async def get_movie(self, tmdb_id: int) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/movie/{tmdb_id}",
                params=self._params({"append_to_response": "external_ids"}),
            )
            r.raise_for_status()
            return r.json()

    async def get_show(self, tmdb_id: int) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/tv/{tmdb_id}",
                params=self._params({"append_to_response": "external_ids"}),
            )
            r.raise_for_status()
            return r.json()

    async def get_season(self, tmdb_id: int, season_number: int) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/tv/{tmdb_id}/season/{season_number}",
                params=self._params(),
            )
            r.raise_for_status()
            return r.json()

    async def get_upcoming_movies(self) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{TMDB_BASE}/movie/upcoming",
                params=self._params(),
            )
            r.raise_for_status()
            return r.json()

    def movie_to_dict(self, data: dict) -> dict:
        external = data.get("external_ids", {})
        genres = ",".join(g["name"] for g in data.get("genres", []))
        release = data.get("release_date", "")
        year = int(release[:4]) if release and len(release) >= 4 else None
        return {
            "tmdb_id": data["id"],
            "imdb_id": external.get("imdb_id") or data.get("imdb_id"),
            "title": data.get("title", ""),
            "year": year,
            "overview": data.get("overview"),
            "poster_path": data.get("poster_path"),
            "backdrop_path": data.get("backdrop_path"),
            "genres": genres,
            "runtime": data.get("runtime"),
            "rating": data.get("vote_average"),
        }

    def show_to_dict(self, data: dict) -> dict:
        external = data.get("external_ids", {})
        genres = ",".join(g["name"] for g in data.get("genres", []))
        first_air = data.get("first_air_date", "")
        year = int(first_air[:4]) if first_air and len(first_air) >= 4 else None
        return {
            "tmdb_id": data["id"],
            "imdb_id": external.get("imdb_id"),
            "tvdb_id": external.get("tvdb_id"),
            "title": data.get("name", ""),
            "year": year,
            "overview": data.get("overview"),
            "poster_path": data.get("poster_path"),
            "backdrop_path": data.get("backdrop_path"),
            "genres": genres,
            "status": data.get("status"),
            "network": data.get("networks", [{}])[0].get("name") if data.get("networks") else None,
            "rating": data.get("vote_average"),
            "total_seasons": data.get("number_of_seasons"),
            "total_episodes": data.get("number_of_episodes"),
        }
