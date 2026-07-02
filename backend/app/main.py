import os
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
    try:
        search_interval = max(1, int(all_settings.get("search_interval_minutes") or 30))
        monitor_interval = max(1, int(all_settings.get("monitor_interval_minutes") or 5))
        refresh_interval = max(1, int(all_settings.get("refresh_interval_hours") or 6)) * 60
    except (ValueError, TypeError):
        search_interval, monitor_interval, refresh_interval = 30, 5, 360
    sched.start_scheduler(search_interval, monitor_interval, refresh_interval)
    yield
    sched.stop_scheduler()


app = FastAPI(title="Automatarr", version="1.0.0", lifespan=lifespan)

# In development or when CORS_ORIGINS is unset, allow all origins (no credentials).
# Set CORS_ORIGINS to a comma-separated list of allowed origins in production.
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] or ["*"]
_allow_credentials = "*" not in _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_allow_credentials,
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
