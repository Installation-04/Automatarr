import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import date

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.show import Show, Season, Episode
from app.services.tmdb import TMDBClient
from app.services import grabber
from app.services.settings_service import get_setting

router = APIRouter(prefix="/api/shows", tags=["shows"])


class AddShowRequest(BaseModel):
    tmdb_id: int
    quality_profile: str = "1080p"
    monitor: bool = True
    monitor_new_seasons: bool = True


class UpdateShowRequest(BaseModel):
    quality_profile: Optional[str] = None
    monitor: Optional[bool] = None
    monitor_new_seasons: Optional[bool] = None


@router.get("")
async def list_shows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Show).order_by(Show.title))
    shows = result.scalars().all()
    return [_show_out(s) for s in shows]


@router.post("")
async def add_show(req: AddShowRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Show).where(Show.tmdb_id == req.tmdb_id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Show already added")

    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured")

    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.get_show(req.tmdb_id)
    show_data = tmdb.show_to_dict(data)

    show = Show(
        **show_data,
        quality_profile=req.quality_profile,
        monitor=req.monitor,
        monitor_new_seasons=req.monitor_new_seasons,
    )
    db.add(show)
    await db.flush()

    today = date.today().isoformat()

    # Import all seasons and episodes
    for season_data in data.get("seasons", []):
        s_num = season_data.get("season_number", 0)
        if s_num == 0:
            continue  # skip specials unless user wants
        season = Season(
            show_id=show.id,
            season_number=s_num,
            name=season_data.get("name"),
            overview=season_data.get("overview"),
            poster_path=season_data.get("poster_path"),
            episode_count=season_data.get("episode_count"),
            monitor=req.monitor,
        )
        db.add(season)
        await db.flush()

        try:
            season_detail = await tmdb.get_season(req.tmdb_id, s_num)
        except Exception as e:
            logger.warning("Could not fetch season %d for tmdb_id %d: %s", s_num, req.tmdb_id, e)
            season_detail = {}

        for ep_data in season_detail.get("episodes", []):
            air_date = ep_data.get("air_date")
            aired = air_date and air_date <= today
            ep = Episode(
                season_id=season.id,
                show_id=show.id,
                tmdb_id=ep_data.get("id"),
                season_number=s_num,
                episode_number=ep_data.get("episode_number"),
                title=ep_data.get("name"),
                overview=ep_data.get("overview"),
                still_path=ep_data.get("still_path"),
                air_date=air_date,
                runtime=ep_data.get("runtime"),
                rating=ep_data.get("vote_average"),
                monitor=req.monitor,
                quality_profile=req.quality_profile,
                status="wanted" if (req.monitor and aired) else "missing",
            )
            db.add(ep)

    await db.commit()
    await db.refresh(show)

    if req.monitor:
        background_tasks.add_task(_grab_wanted_episodes, show.id)

    return _show_out(show)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Show.id)))
    ep_total = await db.scalar(select(func.count(Episode.id)))
    ep_downloaded = await db.scalar(select(func.count(Episode.id)).where(Episode.status == "downloaded"))
    ep_wanted = await db.scalar(select(func.count(Episode.id)).where(Episode.status == "wanted"))
    return {"total": total, "episodes_total": ep_total, "episodes_downloaded": ep_downloaded, "episodes_wanted": ep_wanted}


@router.get("/{show_id}")
async def get_show(show_id: int, db: AsyncSession = Depends(get_db)):
    show = await _get_or_404(db, show_id)
    result = await db.execute(select(Season).where(Season.show_id == show_id).order_by(Season.season_number))
    seasons = result.scalars().all()
    seasons_out = []
    for season in seasons:
        ep_result = await db.execute(
            select(Episode).where(Episode.season_id == season.id).order_by(Episode.episode_number)
        )
        episodes = ep_result.scalars().all()
        seasons_out.append({**_season_out(season), "episodes": [_episode_out(e) for e in episodes]})
    return {**_show_out(show), "seasons": seasons_out}


@router.put("/{show_id}")
async def update_show(show_id: int, req: UpdateShowRequest, db: AsyncSession = Depends(get_db)):
    show = await _get_or_404(db, show_id)
    if req.quality_profile is not None:
        show.quality_profile = req.quality_profile
    if req.monitor is not None:
        show.monitor = req.monitor
    if req.monitor_new_seasons is not None:
        show.monitor_new_seasons = req.monitor_new_seasons
    await db.commit()
    return _show_out(show)


@router.delete("/{show_id}")
async def delete_show(show_id: int, db: AsyncSession = Depends(get_db)):
    show = await _get_or_404(db, show_id)
    await db.delete(show)
    await db.commit()
    return {"ok": True}


@router.post("/{show_id}/search")
async def search_show(show_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    show = await _get_or_404(db, show_id)
    # Mark all missing/errored monitored episodes as wanted and clear stale errors
    result = await db.execute(
        select(Episode).where(
            Episode.show_id == show_id,
            Episode.status.in_(["missing", "error"]),
            Episode.monitor == True,
        )
    )
    episodes = result.scalars().all()
    for ep in episodes:
        ep.status = "wanted"
        ep.last_error = None
    await db.commit()
    background_tasks.add_task(_grab_wanted_episodes, show_id)
    return {"ok": True, "message": f"Search queued for {len(episodes)} episodes"}


@router.put("/{show_id}/seasons/{season_number}/monitor")
async def toggle_season_monitor(show_id: int, season_number: int, monitor: bool, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Season).where(Season.show_id == show_id, Season.season_number == season_number)
    )
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(404, "Season not found")
    season.monitor = monitor
    ep_result = await db.execute(select(Episode).where(Episode.season_id == season.id))
    for ep in ep_result.scalars().all():
        ep.monitor = monitor
    await db.commit()
    return {"ok": True}


@router.post("/{show_id}/refresh")
async def refresh_show(show_id: int, db: AsyncSession = Depends(get_db)):
    show = await _get_or_404(db, show_id)
    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured")
    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.get_show(show.tmdb_id)
    show_data = tmdb.show_to_dict(data)
    for k, v in show_data.items():
        setattr(show, k, v)
    await db.commit()
    return _show_out(show)


async def _get_or_404(db: AsyncSession, show_id: int) -> Show:
    result = await db.execute(select(Show).where(Show.id == show_id))
    show = result.scalar_one_or_none()
    if not show:
        raise HTTPException(404, "Show not found")
    return show


async def _grab_wanted_episodes(show_id: int):
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Show).where(Show.id == show_id))
        show = result.scalar_one_or_none()
        if not show:
            return
        ep_result = await db.execute(
            select(Episode).where(Episode.show_id == show_id, Episode.status == "wanted", Episode.monitor == True)
        )
        episodes = ep_result.scalars().all()
        for ep in episodes:
            try:
                await grabber.grab_episode(db, ep, show)
            except Exception as e:
                logger.error("Error grabbing episode %d for show %d: %s", ep.id, show_id, e)


def _show_out(s: Show) -> dict:
    return {
        "id": s.id, "tmdb_id": s.tmdb_id, "imdb_id": s.imdb_id,
        "title": s.title, "year": s.year, "overview": s.overview,
        "poster_path": s.poster_path, "backdrop_path": s.backdrop_path,
        "genres": s.genres, "status": s.status, "network": s.network,
        "rating": s.rating, "monitor": s.monitor, "quality_profile": s.quality_profile,
        "monitor_new_seasons": s.monitor_new_seasons,
        "total_seasons": s.total_seasons, "total_episodes": s.total_episodes,
        "added_at": s.added_at.isoformat() if s.added_at else None,
    }


def _season_out(s: Season) -> dict:
    return {
        "id": s.id, "show_id": s.show_id, "season_number": s.season_number,
        "name": s.name, "overview": s.overview, "poster_path": s.poster_path,
        "episode_count": s.episode_count, "monitor": s.monitor,
    }


def _episode_out(e: Episode) -> dict:
    return {
        "id": e.id, "show_id": e.show_id, "season_id": e.season_id,
        "season_number": e.season_number, "episode_number": e.episode_number,
        "title": e.title, "overview": e.overview, "still_path": e.still_path,
        "air_date": e.air_date, "runtime": e.runtime, "rating": e.rating,
        "status": e.status, "monitor": e.monitor, "quality_profile": e.quality_profile,
        "symlink_path": e.symlink_path, "last_error": e.last_error,
        "search_attempts": e.search_attempts,
        "downloaded_at": e.downloaded_at.isoformat() if e.downloaded_at else None,
    }
