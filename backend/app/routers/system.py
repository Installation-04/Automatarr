from fastapi import APIRouter, Depends, BackgroundTasks, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
import ipaddress
import urllib.parse
import httpx

from app.database import get_db
from app.models.movie import Movie
from app.models.show import Show, Episode
from app.models.download import ActivityLog, Download
from app.services import grabber
from app.services.settings_service import get_all_settings

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


_ALLOWED_SCHEMES = {"http", "https"}
# Ranges that must never be probed (loopback, link-local/cloud-metadata, unspecified)
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS/GCP metadata, link-local
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fe80::/10"),
]


def _is_safe_probe_url(url: str) -> bool:
    """Allow http/https to any host except loopback / cloud-metadata ranges."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in _ALLOWED_SCHEMES:
            return False
        host = parsed.hostname or ""
        if not host:
            return False
        # Block "localhost" by name
        if host.lower() == "localhost":
            return False
        # If the host is a bare IP, check it against blocked ranges
        try:
            addr = ipaddress.ip_address(host)
            if any(addr in net for net in _BLOCKED_NETWORKS):
                return False
        except ValueError:
            pass  # It's a hostname (e.g. a Docker service name) — allow it
        return True
    except Exception:
        return False


@router.get("/probe")
async def probe(url: str = Query(...)):
    """Used by the onboarding wizard to check if a service URL is reachable."""
    if not _is_safe_probe_url(url):
        raise HTTPException(400, "Invalid or disallowed URL")
    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=False) as c:
            r = await c.get(url)
            return {"ok": True, "status": r.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    today = date.today().isoformat()

    movies_total = await db.scalar(select(func.count(Movie.id)))
    movies_downloaded = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "downloaded"))
    movies_wanted = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "wanted"))
    movies_downloading = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "downloading"))

    shows_total = await db.scalar(select(func.count(Show.id)))
    ep_total = await db.scalar(select(func.count(Episode.id)))
    ep_downloaded = await db.scalar(select(func.count(Episode.id)).where(Episode.status == "downloaded"))
    ep_wanted = await db.scalar(select(func.count(Episode.id)).where(Episode.status == "wanted"))
    ep_downloading = await db.scalar(select(func.count(Episode.id)).where(Episode.status == "downloading"))

    # Recent activity
    log_result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10)
    )
    recent = [
        {
            "event_type": l.event_type,
            "media_type": l.media_type,
            "media_title": l.media_title,
            "message": l.message,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in log_result.scalars().all()
    ]

    # Upcoming episodes (next 14 days)
    from datetime import timedelta
    end_date = (date.today() + timedelta(days=14)).isoformat()
    upcoming_result = await db.execute(
        select(Episode, Show)
        .join(Show, Show.id == Episode.show_id)
        .where(Episode.air_date >= today, Episode.air_date <= end_date, Episode.monitor == True)
        .order_by(Episode.air_date)
        .limit(20)
    )
    upcoming = []
    for ep, show in upcoming_result.all():
        upcoming.append({
            "show_id": show.id,
            "show_title": show.title,
            "show_poster": show.poster_path,
            "season_number": ep.season_number,
            "episode_number": ep.episode_number,
            "episode_title": ep.title,
            "air_date": ep.air_date,
            "status": ep.status,
        })

    return {
        "movies": {
            "total": movies_total,
            "downloaded": movies_downloaded,
            "wanted": movies_wanted,
            "downloading": movies_downloading,
        },
        "shows": {
            "total": shows_total,
            "episodes_total": ep_total,
            "episodes_downloaded": ep_downloaded,
            "episodes_wanted": ep_wanted,
            "episodes_downloading": ep_downloading,
        },
        "recent_activity": recent,
        "upcoming": upcoming,
    }


@router.post("/search/all")
async def trigger_search_all(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Manually trigger search for all wanted items."""
    background_tasks.add_task(_run_search_all)
    return {"ok": True, "message": "Search triggered for all wanted items"}


async def _run_search_all():
    from app.database import AsyncSessionLocal
    from app.services.scheduler import _search_wanted
    await _search_wanted()
