from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.services import scheduler as sched
from app.services.settings_service import get_all_settings
from app.database import AsyncSessionLocal
from app.routers import movies, shows, search, downloads, settings, system, calendar


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with AsyncSessionLocal() as db:
        all_settings = await get_all_settings(db)
    search_interval = int(all_settings.get("search_interval_minutes") or 30)
    monitor_interval = int(all_settings.get("monitor_interval_minutes") or 5)
    refresh_interval = int(all_settings.get("refresh_interval_hours") or 6) * 60
    sched.start_scheduler(search_interval, monitor_interval, refresh_interval)
    yield
    sched.stop_scheduler()


app = FastAPI(title="Automatarr", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies.router)
app.include_router(shows.router)
app.include_router(search.router)
app.include_router(downloads.router)
app.include_router(settings.router)
app.include_router(system.router)
app.include_router(calendar.router)


@app.get("/")
async def root():
    return {"name": "Automatarr", "version": "1.0.0"}
