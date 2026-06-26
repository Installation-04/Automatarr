import httpx
import re
from typing import Optional

TORRENTIO_BASE = "https://torrentio.strem.fun"

QUALITY_PRIORITY = {
    "4k": ["2160p", "4K", "UHD"],
    "1080p": ["1080p"],
    "720p": ["720p"],
    "any": [],
}

SOURCE_PRIORITY = ["BluRay", "BDRip", "Remux", "WEB-DL", "WEBRip", "HDTV", "DVDRip"]


def _parse_quality(title: str) -> str:
    title_upper = title.upper()
    if any(k in title_upper for k in ["2160P", "4K", "UHD"]):
        return "4k"
    if "1080P" in title_upper:
        return "1080p"
    if "720P" in title_upper:
        return "720p"
    return "unknown"


def _parse_size_gb(title: str) -> float:
    m = re.search(r"💾\s*([\d.]+)\s*(GB|MB)", title)
    if m:
        val = float(m.group(1))
        if m.group(2) == "MB":
            val /= 1024
        return val
    return 0.0


def _parse_seeders(title: str) -> int:
    m = re.search(r"👤\s*(\d+)", title)
    return int(m.group(1)) if m else 0


def _parse_source(name: str) -> int:
    name_upper = name.upper()
    for i, src in enumerate(SOURCE_PRIORITY):
        if src.upper() in name_upper:
            return i
    return len(SOURCE_PRIORITY)


def _quality_rank(quality: str, preferred: str) -> int:
    order = ["4k", "1080p", "720p", "unknown"]
    if preferred == "4k":
        order = ["4k", "1080p", "720p", "unknown"]
    elif preferred == "1080p":
        order = ["1080p", "720p", "4k", "unknown"]
    elif preferred == "720p":
        order = ["720p", "1080p", "4k", "unknown"]
    try:
        return order.index(quality)
    except ValueError:
        return 99


class TorrentioClient:
    def __init__(self, base_url: str = TORRENTIO_BASE, options: str = ""):
        self.base_url = base_url.rstrip("/")
        self.options = options  # e.g. "sort=qualitysize|qualityfilter=480p,scr,cam"

    def _opts_prefix(self) -> str:
        if self.options:
            return f"/{self.options}"
        return ""

    async def search_movie(self, imdb_id: str) -> list[dict]:
        url = f"{self.base_url}{self._opts_prefix()}/stream/movie/{imdb_id}.json"
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return []
            data = r.json()
            return data.get("streams", [])

    async def search_episode(self, imdb_id: str, season: int, episode: int) -> list[dict]:
        url = f"{self.base_url}{self._opts_prefix()}/stream/series/{imdb_id}:{season}:{episode}.json"
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return []
            data = r.json()
            return data.get("streams", [])

    def pick_best_stream(self, streams: list[dict], quality_profile: str = "1080p") -> Optional[dict]:
        """Score and return the best stream for the given quality profile."""
        scored = []
        for s in streams:
            info_hash = s.get("infoHash", "")
            if not info_hash:
                continue
            title = s.get("title", "")
            name = s.get("name", "")
            quality = _parse_quality(title + " " + name)
            seeders = _parse_seeders(title)
            size_gb = _parse_size_gb(title)
            source_rank = _parse_source(name + " " + title)
            q_rank = _quality_rank(quality, quality_profile)

            # Filter: skip if quality is too low for 1080p/4k profiles
            if quality_profile == "4k" and quality == "unknown":
                continue
            if quality_profile == "1080p" and quality in ("unknown",) and size_gb < 0.5:
                continue

            # Score: lower is better
            score = (q_rank * 1000) + (source_rank * 10) - min(seeders, 100)
            scored.append((score, s, quality, seeders, size_gb))

        if not scored:
            # Fallback: return any stream with a hash
            for s in streams:
                if s.get("infoHash"):
                    return s
            return None

        scored.sort(key=lambda x: x[0])
        return scored[0][1]

    def get_magnet(self, stream: dict) -> Optional[str]:
        info_hash = stream.get("infoHash", "")
        if not info_hash:
            return None
        trackers = [
            "udp://open.stealth.si:80/announce",
            "udp://tracker.opentrackr.org:1337/announce",
            "udp://tracker.torrent.eu.org:451/announce",
            "udp://tracker.openbittorrent.com:6969/announce",
        ]
        tracker_str = "&tr=".join(trackers)
        return f"magnet:?xt=urn:btih:{info_hash}&tr={tracker_str}"
