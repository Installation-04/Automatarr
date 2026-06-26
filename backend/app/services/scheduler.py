from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from datetime import date

from app.database import AsyncSessionLocal
from app.models.movie import Movie
from app.models.show import Episode
from app.services import grabber
from app.services.settings_service import get_all_settings

scheduler = AsyncIOScheduler()


async def _search_wanted():
    async with AsyncSessionLocal() as db:
        settings = await get_all_settings(db)
        if not settings.get("rd_api_key"):
            return

        result = await db.execute(select(Movie).where(Movie.status == "wanted", Movie.monitor == True))
        movies = result.scalars().all()
        for movie in movies:
            try:
                await grabber.grab_movie(db, movie)
            except Exception:
                pass

        result = await db.execute(
            select(Episode).where(Episode.status == "wanted", Episode.monitor == True)
        )
        episodes = result.scalars().all()
        from app.models.show import Show
        for episode in episodes:
            try:
                show_result = await db.execute(select(Show).where(Show.id == episode.show_id))
                show = show_result.scalar_one_or_none()
                if show and show.monitor:
                    await grabber.grab_episode(db, episode, show)
            except Exception:
                pass


async def _monitor_downloads():
    async with AsyncSessionLocal() as db:
        try:
            await grabber.monitor_downloading(db)
        except Exception:
            pass


async def _refresh_upcoming():
    """Mark episodes as wanted if their air date has passed."""
    async with AsyncSessionLocal() as db:
        today = date.today().isoformat()
        result = await db.execute(
            select(Episode).where(
                Episode.status == "missing",
                Episode.monitor == True,
                Episode.air_date <= today,
            )
        )
        episodes = result.scalars().all()
        for ep in episodes:
            ep.status = "wanted"
        if episodes:
            await db.commit()


def start_scheduler(search_interval: int = 30, monitor_interval: int = 5, refresh_interval: int = 360):
    scheduler.add_job(_search_wanted, IntervalTrigger(minutes=search_interval), id="search_wanted", replace_existing=True)
    scheduler.add_job(_monitor_downloads, IntervalTrigger(minutes=monitor_interval), id="monitor_downloads", replace_existing=True)
    scheduler.add_job(_refresh_upcoming, IntervalTrigger(minutes=refresh_interval), id="refresh_upcoming", replace_existing=True)
    if not scheduler.running:
        scheduler.start()


def update_scheduler_intervals(search_interval: int, monitor_interval: int, refresh_interval: int):
    if scheduler.running:
        scheduler.remove_all_jobs()
        start_scheduler(search_interval, monitor_interval, refresh_interval)


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
