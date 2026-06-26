import httpx
from typing import Optional
import asyncio

RD_BASE = "https://api.real-debrid.com/rest/1.0"


class RealDebridError(Exception):
    pass


class RealDebridClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"Authorization": f"Bearer {api_key}"}

    async def _get(self, path: str, params: dict = None):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"{RD_BASE}{path}", headers=self.headers, params=params)
            if r.status_code == 401:
                raise RealDebridError("Invalid Real-Debrid API key")
            if r.status_code not in (200, 201):
                raise RealDebridError(f"RD API error {r.status_code}: {r.text}")
            return r.json()

    async def _post(self, path: str, data: dict = None):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{RD_BASE}{path}", headers=self.headers, data=data)
            if r.status_code == 401:
                raise RealDebridError("Invalid Real-Debrid API key")
            if r.status_code not in (200, 201, 204):
                raise RealDebridError(f"RD API error {r.status_code}: {r.text}")
            if r.status_code == 204:
                return {}
            return r.json()

    async def _delete(self, path: str):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.delete(f"{RD_BASE}{path}", headers=self.headers)
            return r.status_code in (200, 204)

    async def get_user(self) -> dict:
        return await self._get("/user")

    async def check_instant_availability(self, hashes: list[str]) -> dict:
        """Check if hashes are instantly available on RD."""
        joined = "/".join(hashes)
        return await self._get(f"/torrents/instantAvailability/{joined}")

    async def add_magnet(self, magnet: str) -> dict:
        """Add a magnet link. Returns {id, uri}."""
        return await self._post("/torrents/addMagnet", {"magnet": magnet})

    async def add_torrent(self, torrent_bytes: bytes) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.put(
                f"{RD_BASE}/torrents/addTorrent",
                headers=self.headers,
                content=torrent_bytes,
            )
            if r.status_code not in (200, 201):
                raise RealDebridError(f"RD API error {r.status_code}: {r.text}")
            return r.json()

    async def select_files(self, torrent_id: str, file_ids: str = "all"):
        """Select files to download. file_ids='all' or comma-separated IDs."""
        await self._post(f"/torrents/selectFiles/{torrent_id}", {"files": file_ids})

    async def get_torrent_info(self, torrent_id: str) -> dict:
        return await self._get(f"/torrents/info/{torrent_id}")

    async def list_torrents(self) -> list:
        return await self._get("/torrents")

    async def delete_torrent(self, torrent_id: str) -> bool:
        return await self._delete(f"/torrents/delete/{torrent_id}")

    async def unrestrict_link(self, link: str) -> dict:
        return await self._post("/unrestrict/link", {"link": link})

    async def list_downloads(self) -> list:
        return await self._get("/downloads")

    async def wait_for_torrent(
        self,
        torrent_id: str,
        poll_interval: int = 5,
        timeout: int = 300,
    ) -> dict:
        """Poll until torrent status is 'downloaded' or raises on timeout/error."""
        elapsed = 0
        while elapsed < timeout:
            info = await self.get_torrent_info(torrent_id)
            status = info.get("status", "")
            if status == "downloaded":
                return info
            if status in ("error", "dead", "magnet_error"):
                raise RealDebridError(f"Torrent failed with status: {status}")
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        raise RealDebridError(f"Torrent {torrent_id} did not complete within {timeout}s")

    async def add_and_select(self, magnet: str) -> dict:
        """Add magnet, select all files, return torrent info dict."""
        result = await self.add_magnet(magnet)
        torrent_id = result["id"]
        await self.select_files(torrent_id, "all")
        return await self.get_torrent_info(torrent_id)

    def hash_from_magnet(self, magnet: str) -> Optional[str]:
        import re
        m = re.search(r"btih:([a-fA-F0-9]{40})", magnet)
        if m:
            return m.group(1).lower()
        m = re.search(r"btih:([a-zA-Z2-7]{32})", magnet)
        if m:
            import base64
            try:
                decoded = base64.b32decode(m.group(1).upper())
                return decoded.hex()
            except Exception:
                pass
        return None
